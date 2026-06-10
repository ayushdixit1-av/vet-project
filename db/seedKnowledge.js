const { Pool } = require('pg');
require('dotenv').config({ override: true });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Knowledge Categories
    const categories = [
      { name: 'Anatomy', slug: 'anatomy', description: 'Study of the structure of animal bodies, including bones, muscles, organs, and tissues.', icon: 'brain', sort_order: 1 },
      { name: 'Physiology', slug: 'physiology', description: 'Study of how animal bodies function, including organ systems and biological processes.', icon: 'activity', sort_order: 2 },
      { name: 'Parasitology', slug: 'parasitology', description: 'Study of parasites that affect animals, including their life cycles, transmission, and control.', icon: 'bug', sort_order: 3 },
      { name: 'Medicine', slug: 'medicine', description: 'Veterinary internal medicine covering diagnosis and treatment of animal diseases.', icon: 'heart-pulse', sort_order: 4 },
      { name: 'Surgery', slug: 'surgery', description: 'Veterinary surgical procedures, techniques, and perioperative care.', icon: 'scissors', sort_order: 5 },
      { name: 'Pathology', slug: 'pathology', description: 'Study of disease processes, including etiology, pathogenesis, and morphological changes.', icon: 'microscope', sort_order: 6 },
      { name: 'Pharmacology', slug: 'pharmacology', description: 'Study of drugs and their effects on animal bodies, including pharmacokinetics and pharmacodynamics.', icon: 'pill', sort_order: 7 },
    ];

    for (const cat of categories) {
      await client.query(
        `INSERT INTO knowledge_categories (name, slug, description, icon, status, sort_order, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'active', $5, NOW(), NOW())
         ON CONFLICT (slug) DO NOTHING`,
        [cat.name, cat.slug, cat.description, cat.icon, cat.sort_order]
      );
    }
    console.log('Knowledge categories seeded');

    // Get category IDs
    const catsResult = await client.query('SELECT id, slug FROM knowledge_categories');
    const catMap = {};
    catsResult.rows.forEach(r => { catMap[r.slug] = r.id; });

    // Knowledge Subcategories
    const subcategories = [
      { name: 'Osteology', slug: 'osteology', category_slug: 'anatomy', description: 'Study of the structure and function of the skeletal system.', sort_order: 1 },
      { name: 'Myology', slug: 'myology', category_slug: 'anatomy', description: 'Study of muscles, their structure, function, and classification.', sort_order: 2 },
      { name: 'Angiology', slug: 'angiology', category_slug: 'anatomy', description: 'Study of the circulatory system including blood vessels and lymphatics.', sort_order: 3 },
      { name: 'Histology', slug: 'histology', category_slug: 'anatomy', description: 'Study of tissues at the microscopic level.', sort_order: 4 },
      { name: 'Nervous System', slug: 'nervous-system', category_slug: 'physiology', description: 'Study of the structure and function of the nervous system.', sort_order: 1 },
      { name: 'Digestive System', slug: 'digestive-system', category_slug: 'physiology', description: 'Study of the digestive system and its functions.', sort_order: 2 },
      { name: 'General Parasitology', slug: 'general-parasitology', category_slug: 'parasitology', description: 'Introduction to veterinary parasitology including host-parasite relationships.', sort_order: 1 },
      { name: 'Protozoology', slug: 'protozoology', category_slug: 'parasitology', description: 'Study of protozoan parasites affecting animals.', sort_order: 2 },
      { name: 'Helminthology', slug: 'helminthology', category_slug: 'parasitology', description: 'Study of helminth (worm) parasites affecting animals.', sort_order: 3 },
      { name: 'Arthropodology', slug: 'arthropodology', category_slug: 'parasitology', description: 'Study of arthropod parasites including ticks, mites, and insects.', sort_order: 4 },
    ];

    for (const subcat of subcategories) {
      const catId = catMap[subcat.category_slug];
      if (catId) {
        await client.query(
          `INSERT INTO knowledge_subcategories (category_id, name, slug, description, status, sort_order, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 'active', $5, NOW(), NOW())
           ON CONFLICT (category_id, slug) DO NOTHING`,
          [catId, subcat.name, subcat.slug, subcat.description, subcat.sort_order]
        );
      }
    }
    console.log('Knowledge subcategories seeded');

    await client.query('COMMIT');
    console.log('Seed completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);
