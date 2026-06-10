const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const pool = require('../db/pool');
const { verifyToken } = require('../middleware/auth');
const { checkCredits, deductCredits, CREDITS_PER_CHAT } = require('../middleware/credits');

const apiKey = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || process.env.XAI_API_KEY;

let providerConfig;
if (apiKey) {
  if (apiKey.startsWith('gsk_')) {
    providerConfig = { baseURL: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' };
  } else if (apiKey.startsWith('xai-')) {
    providerConfig = { baseURL: 'https://api.x.ai/v1', model: 'grok-4.3-latest' };
  } else {
    providerConfig = { baseURL: undefined, model: 'gpt-4o-mini' };
  }
}

async function searchKnowledgeBase(query) {
  const term = query.trim().split(/\s+/).filter(w => w.length > 2).join(' & ');
  if (!term) return {};

  const tsquery = term.split(' & ').map(w => w + ':*').join(' & ');

  try {
    const [diseases, medicines, articles, breeds, procedures, vaccines, courses] = await Promise.all([
      pool.query(`
        SELECT name, species, symptoms, causes, diagnosis, treatment, prevention, images
        FROM diseases WHERE status = 'active' AND (
          to_tsvector('english', name || ' ' || overview || ' ' || symptoms) @@ to_tsquery('english', $1)
          OR name ILIKE $2 OR symptoms ILIKE $2 OR treatment ILIKE $2
        ) LIMIT 5
      `, [tsquery, `%${query.trim()}%`]),

      pool.query(`
        SELECT name, generic_name, category, species, dosage, indications, contraindications, side_effects
        FROM medicines WHERE (
          name ILIKE $1 OR generic_name ILIKE $1 OR indications ILIKE $1 OR category ILIKE $1
        ) LIMIT 5
      `, [`%${query.trim()}%`]),

      pool.query(`
        SELECT title, excerpt, tags, featured_image
        FROM articles WHERE status = 'active' AND (
          to_tsvector('english', title || ' ' || excerpt) @@ to_tsquery('english', $1)
          OR title ILIKE $2 OR excerpt ILIKE $2 OR tags ILIKE $2
        ) LIMIT 5
      `, [tsquery, `%${query.trim()}%`]),

      pool.query(`
        SELECT name, species, origin, characteristics, common_diseases, images
        FROM breeds WHERE status = 'active' AND (
          name ILIKE $1 OR characteristics ILIKE $1 OR species ILIKE $1
        ) LIMIT 3
      `, [`%${query.trim()}%`]),

      pool.query(`
        SELECT name, category, species, description, indications, technique, aftercare, images
        FROM procedures WHERE status = 'active' AND (
          name ILIKE $1 OR description ILIKE $1 OR category ILIKE $1 OR indications ILIKE $1
        ) LIMIT 5
      `, [`%${query.trim()}%`]),

      pool.query(`
        SELECT name, species, description, indications, dosage, schedule
        FROM vaccines WHERE status = 'active' AND (
          name ILIKE $1 OR description ILIKE $1 OR indications ILIKE $1 OR species ILIKE $1
        ) LIMIT 5
      `, [`%${query.trim()}%`]),

      pool.query(`
        SELECT title, description, difficulty
        FROM courses WHERE published = true AND (
          title ILIKE $1 OR description ILIKE $1 OR category ILIKE $1
        ) LIMIT 3
      `, [`%${query.trim()}%`])
    ]);

    return {
      diseases: diseases.rows,
      medicines: medicines.rows,
      articles: articles.rows,
      breeds: breeds.rows,
      procedures: procedures.rows,
      vaccines: vaccines.rows,
      courses: courses.rows
    };
  } catch (e) {
    console.error('Knowledge search error:', e.message);
    return {};
  }
}

function extractImages(data) {
  const images = [];
  const seen = new Set();

  try {
    if (data.diseases) {
      data.diseases.forEach(d => {
        if (d.images) {
          let imgs = typeof d.images === 'string' ? JSON.parse(d.images) : d.images;
          if (Array.isArray(imgs)) {
            imgs.forEach(url => {
              if (url && !seen.has(url)) { seen.add(url); images.push({ url, alt: d.name + ' - ' + (d.species || 'disease'), source: 'VetCrack' }); }
            });
          }
        }
      });
    }
    if (data.breeds) {
      data.breeds.forEach(b => {
        if (b.images) {
          let imgs = typeof b.images === 'string' ? JSON.parse(b.images) : b.images;
          if (Array.isArray(imgs)) {
            imgs.forEach(url => {
              if (url && !seen.has(url)) { seen.add(url); images.push({ url, alt: b.name + ' breed', source: 'VetCrack' }); }
            });
          }
        }
      });
    }
    if (data.procedures) {
      data.procedures.forEach(p => {
        if (p.images) {
          let imgs = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
          if (Array.isArray(imgs)) {
            imgs.forEach(url => {
              if (url && !seen.has(url)) { seen.add(url); images.push({ url, alt: p.name + ' procedure', source: 'VetCrack' }); }
            });
          }
        }
      });
    }
    if (data.articles) {
      data.articles.forEach(a => {
        if (a.featured_image && !seen.has(a.featured_image)) {
          seen.add(a.featured_image);
          images.push({ url: a.featured_image, alt: a.title, source: 'VetCrack' });
        }
      });
    }
  } catch (e) {}

  return images;
}

async function searchWebImages(query) {
  try {
    const terms = query.trim().split(/\s+/).filter(w => w.length > 3).slice(0, 5).join(' ');
    if (!terms) return [];
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(terms + ' veterinary')}&srlimit=5&format=json&origin=*`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    if (!searchData?.query?.search?.length) return [];
    const pageTitles = searchData.query.search.slice(0, 4).map(p => p.title);
    const imgUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitles.join('|'))}&prop=pageimages&pithumbsize=400&format=json&origin=*`;
    const imgRes = await fetch(imgUrl);
    const imgData = await imgRes.json();
    const pages = imgData?.query?.pages || {};
    const images = [];
    const seen = new Set();
    for (const id of Object.keys(pages)) {
      const page = pages[id];
      if (page?.thumbnail?.source && !seen.has(page.thumbnail.source)) {
        seen.add(page.thumbnail.source);
        images.push({ url: page.thumbnail.source, alt: page.title || terms, source: 'Wikipedia' });
      }
    }
    return images;
  } catch (e) {
    return [];
  }
}

function formatKnowledgeContext(data) {
  let context = '';

  if (data.diseases?.length) {
    context += '\n\n## RELEVANT DISEASES FROM KNOWLEDGE BASE:\n';
    data.diseases.forEach(d => {
      context += `### ${d.name} (${d.species || 'Various'})\n`;
      if (d.symptoms) context += `Symptoms: ${d.symptoms.substring(0, 300)}\n`;
      if (d.causes) context += `Causes: ${d.causes.substring(0, 200)}\n`;
      if (d.diagnosis) context += `Diagnosis: ${d.diagnosis.substring(0, 200)}\n`;
      if (d.treatment) context += `Treatment: ${d.treatment.substring(0, 300)}\n`;
      if (d.prevention) context += `Prevention: ${d.prevention.substring(0, 200)}\n`;
      context += '\n';
    });
  }

  if (data.medicines?.length) {
    context += '\n## RELEVANT MEDICINES FROM KNOWLEDGE BASE:\n';
    data.medicines.forEach(m => {
      context += `### ${m.name}${m.generic_name ? ` (${m.generic_name})` : ''} — ${m.category || ''}, ${m.species || 'Various'}\n`;
      if (m.dosage) context += `Dosage: ${m.dosage.substring(0, 200)}\n`;
      if (m.indications) context += `Indications: ${m.indications.substring(0, 200)}\n`;
      if (m.contraindications) context += `Contraindications: ${m.contraindications.substring(0, 200)}\n`;
      if (m.side_effects) context += `Side effects: ${m.side_effects.substring(0, 200)}\n`;
      context += '\n';
    });
  }

  if (data.procedures?.length) {
    context += '\n## RELEVANT PROCEDURES:\n';
    data.procedures.forEach(p => {
      context += `### ${p.name} (${p.category || ''}) — ${p.species || 'Various'}\n`;
      if (p.description) context += `Description: ${p.description.substring(0, 200)}\n`;
      if (p.indications) context += `Indications: ${p.indications.substring(0, 200)}\n`;
      if (p.technique) context += `Technique: ${p.technique.substring(0, 300)}\n`;
      if (p.aftercare) context += `Aftercare: ${p.aftercare.substring(0, 200)}\n`;
      context += '\n';
    });
  }

  if (data.vaccines?.length) {
    context += '\n## RELEVANT VACCINES:\n';
    data.vaccines.forEach(v => {
      context += `### ${v.name} — ${v.species || 'Various'}\n`;
      if (v.description) context += `Description: ${v.description.substring(0, 200)}\n`;
      if (v.indications) context += `Indications: ${v.indications.substring(0, 200)}\n`;
      if (v.dosage) context += `Dosage: ${v.dosage.substring(0, 200)}\n`;
      if (v.schedule) context += `Schedule: ${v.schedule.substring(0, 200)}\n`;
      context += '\n';
    });
  }

  if (data.breeds?.length) {
    context += '\n## RELEVANT BREEDS:\n';
    data.breeds.forEach(b => {
      context += `### ${b.name} (${b.species || 'Unknown'})\n`;
      if (b.origin) context += `Origin: ${b.origin.substring(0, 150)}\n`;
      if (b.characteristics) context += `Characteristics: ${b.characteristics.substring(0, 200)}\n`;
      if (b.common_diseases) context += `Common diseases: ${b.common_diseases.substring(0, 200)}\n`;
      context += '\n';
    });
  }

  if (data.articles?.length) {
    context += '\n## RELEVANT ARTICLES:\n';
    data.articles.forEach(a => {
      context += `- ${a.title}${a.tags ? ` [Tags: ${a.tags}]` : ''}\n`;
      if (a.excerpt) context += `  Summary: ${a.excerpt.substring(0, 200)}\n`;
    });
    context += '\n';
  }

  if (data.courses?.length) {
    context += '\n## RELEVANT COURSES ON PLATFORM:\n';
    data.courses.forEach(c => {
      context += `- ${c.title} (${c.difficulty || 'All levels'})\n`;
    });
    context += '\n';
  }

  return context;
}

function buildSystemPrompt(knowledgeContext, language, images) {
  const isHinglish = language === 'hinglish';

  const base = `You are **VetBot**, an expert veterinary AI assistant for VetCrack — India's premier veterinary education platform.

## YOUR EXPERTISE
- Veterinary anatomy, physiology, pathology, and pharmacology
- Animal diseases — etiology, pathogenesis, clinical signs, diagnosis, treatment, prevention
- Veterinary surgery, medical procedures, and diagnostic techniques
- Animal nutrition, husbandry, and production medicine
- Veterinary microbiology, immunology, parasitology, and public health
- Vaccine schedules, immunization protocols, and disease control programs
- Companion animal, livestock, poultry, and exotic animal medicine

## 7-MARK EXAM ANSWER FORMAT
Answer every question as if it is a **7-mark university exam question**. Structure your response exactly like this:

### 1. Introduction
Define the topic, give relevant background, mention species affected.

### 2. Etiology / Cause
Explain the causative agent, predisposing factors, epidemiology.

### 3. Pathogenesis
Describe the disease mechanism step-by-step — how it develops in the body.

### 4. Clinical Signs / Symptoms
List key signs with species-specific variations. Use bullet points.

### 5. Diagnosis
Cover: History → Clinical examination → Laboratory findings → Imaging → Post-mortem (if relevant)

### 6. Treatment / Management
Medical (drug names, doses, route, duration) → Surgical (if applicable) → Supportive care → Nursing

### 7. Prevention & Control
Vaccination protocols, biosecurity, management practices, public health significance.

### 8. Conclusion
Prognosis, key takeaways, when to consult a veterinarian.

## GUIDELINES
- Write in clear, structured paragraphs with markdown headings (###), bold terms, and bullet points.
- Use proper veterinary terminology throughout.
- When you have relevant knowledge base content below, USE IT directly — cite specific diseases, drugs, doses, and procedures.
- Always include disclaimers: "Consult a licensed veterinarian for diagnosis and treatment."
- For emergencies, stress: "This is an emergency — seek immediate veterinary care."
- Recommend relevant VetCrack courses or articles when applicable.
- ${isHinglish ? 'Write the ENTIRE answer in Hinglish (Hindi+English mix). Use Hindi script for explanations but keep veterinary terms in English. Students should feel like they are learning from a Hindi-medium professor.' : 'Write the ENTIRE answer in English with proper veterinary terminology.'}`;

  let imgSection = '';
  if (images?.length) {
    imgSection += '\n\n## RELEVANT IMAGES (shown below answer)\nThe following images will be displayed with your answer:\n';
    images.forEach((img, i) => {
      imgSection += `Image ${i + 1}: ${img.alt} (Source: ${img.source})\n`;
    });
    imgSection += '\nIn your answer, refer to these images where relevant (e.g. "See the image of [topic]" or "As shown in the image above").';
  }

  return `${base}${imgSection}

${knowledgeContext ? `\n## KNOWLEDGE BASE CONTENT RELEVANT TO THIS QUESTION\nUse the following information from VetCrack's knowledge base to enrich your answer:\n${knowledgeContext}` : ''}

Always aim to educate thoroughly — every answer should be worth full 7 marks in a veterinary exam.`;
}

router.post('/', verifyToken, checkCredits, async (req, res) => {
  try {
    const { message, language } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!apiKey) {
      return res.status(503).json({ error: 'AI assistant is not configured. Set OPENAI_API_KEY or GROQ_API_KEY in .env' });
    }

    const lang = language === 'hinglish' ? 'hinglish' : 'english';

    const openai = new OpenAI({
      apiKey,
      baseURL: providerConfig.baseURL
    });

    const [knowledgeData] = await Promise.all([
      searchKnowledgeBase(message)
    ]);

    const knowledgeContext = formatKnowledgeContext(knowledgeData);

    // Search images from DB + web in parallel with AI call
    const [imagesFromDb, imagesFromWeb] = await Promise.all([
      Promise.resolve(extractImages(knowledgeData)),
      searchWebImages(message)
    ]);

    const allImages = [...imagesFromDb, ...imagesFromWeb].slice(0, 3);
    const systemPrompt = buildSystemPrompt(knowledgeContext, lang, allImages);

    const completion = await openai.chat.completions.create({
      model: providerConfig.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 4096,
      temperature: 0.7
    });

    const reply = completion.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    let remaining = req.availableCredits;
    try {
      remaining = await deductCredits(req.user.uid, CREDITS_PER_CHAT, 'Chat message', '');
    } catch (e) {}

    res.json({ reply, images: allImages, language: lang, creditsRemaining: remaining, creditsUsed: CREDITS_PER_CHAT });
  } catch (err) {
    console.error('Chat error:', err.message);

    if (err.status === 401 || err.code === 'invalid_api_key') {
      return res.status(503).json({ error: 'AI service is not configured correctly. Please check your API key.' });
    }
    if (err.status === 403) {
      return res.status(503).json({ error: 'AI service account needs credits. Please add billing at https://console.x.ai.' });
    }
    if (err.status === 429) {
      const msg = err.message || '';
      if (msg.includes('quota') || msg.includes('billing')) {
        return res.status(503).json({ error: 'AI service quota exceeded. Please check your billing plan.' });
      }
      return res.status(503).json({ error: 'AI service is rate limited. Please try again later.' });
    }

    res.status(500).json({ error: 'AI service error. Please try again.' });
  }
});

module.exports = router;