const pool = require('./pool');

async function initSchema() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        uid VARCHAR(128) PRIMARY KEY,
        name VARCHAR(255) NOT NULL DEFAULT '',
        email VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS courses (
        course_id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT DEFAULT '',
        thumbnail TEXT DEFAULT '',
        category VARCHAR(100) DEFAULT 'general',
        price NUMERIC(10,2) DEFAULT 0,
        difficulty VARCHAR(50) DEFAULT 'beginner',
        is_free BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sections (
        section_id VARCHAR(64) PRIMARY KEY,
        course_id VARCHAR(64) NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
        section_title VARCHAR(255) NOT NULL,
        "order" INTEGER DEFAULT 0,
        parent_id VARCHAR(64) REFERENCES sections(section_id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sections_course_id ON sections(course_id);
    `);

    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sections' AND column_name='parent_id') THEN
          ALTER TABLE sections ADD COLUMN parent_id VARCHAR(64) REFERENCES sections(section_id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sections' AND column_name='parent_id') THEN
          CREATE INDEX IF NOT EXISTS idx_sections_parent_id ON sections(parent_id);
        END IF;
      END $$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS pdfs (
        pdf_id VARCHAR(64) PRIMARY KEY,
        course_id VARCHAR(64) NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
        section_id VARCHAR(64) NOT NULL REFERENCES sections(section_id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        drive_link TEXT NOT NULL,
        file_id VARCHAR(255) DEFAULT '',
        embed_url TEXT DEFAULT '',
        thumbnail_url TEXT DEFAULT '',
        view_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_pdfs_course_id ON pdfs(course_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_pdfs_section_id ON pdfs(section_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS contents (
        content_id VARCHAR(64) PRIMARY KEY,
        section_id VARCHAR(64) NOT NULL REFERENCES sections(section_id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'video',
        file_url TEXT DEFAULT '',
        drive_link TEXT DEFAULT '',
        file_id VARCHAR(255) DEFAULT '',
        embed_url TEXT DEFAULT '',
        "order" INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_contents_section_id ON contents(section_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        purchase_id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(128) NOT NULL,
        user_email VARCHAR(255) DEFAULT '',
        course_id VARCHAR(64) NOT NULL,
        payment_id VARCHAR(255) DEFAULT '',
        order_id VARCHAR(255) DEFAULT '',
        amount NUMERIC(10,2) DEFAULT 0,
        payment_status VARCHAR(50) DEFAULT 'pending',
        purchased_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_purchases_course_id ON purchases(course_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS blogs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE DEFAULT '',
        thumbnail TEXT DEFAULT '',
        description TEXT DEFAULT '',
        content TEXT DEFAULT '',
        author VARCHAR(255) DEFAULT 'VetCrack',
        category VARCHAR(100) DEFAULT '',
        tags TEXT DEFAULT '',
        meta_title VARCHAR(255) DEFAULT '',
        meta_description TEXT DEFAULT '',
        status VARCHAR(20) DEFAULT 'draft',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Add new columns if missing (safe re-run)
    const newCols = [
      { name: 'slug', type: "VARCHAR(255) DEFAULT ''" },
      { name: 'category', type: "VARCHAR(100) DEFAULT ''" },
      { name: 'meta_title', type: "VARCHAR(255) DEFAULT ''" },
      { name: 'meta_description', type: "TEXT DEFAULT ''" },
    ];
    for (const col of newCols) {
      try {
        await client.query(`ALTER TABLE blogs ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
      } catch (e) {}
    }
    try {
      await client.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug) WHERE slug != \'\'');
    } catch (e) {}

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_purchases (
        user_id VARCHAR(128) NOT NULL,
        course_id VARCHAR(64) NOT NULL,
        purchase_id VARCHAR(64) NOT NULL,
        PRIMARY KEY (user_id, course_id)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_purchases_user_id ON user_purchases(user_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        review_id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(128) NOT NULL UNIQUE,
        user_name VARCHAR(255) NOT NULL DEFAULT '',
        qualification VARCHAR(255) DEFAULT '',
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='qualification') THEN
          ALTER TABLE reviews ADD COLUMN qualification VARCHAR(255) DEFAULT '';
        END IF;
      END $$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        key VARCHAR(128) PRIMARY KEY,
        value TEXT NOT NULL DEFAULT '',
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      INSERT INTO site_settings (key, value) VALUES
        ('founder_name', 'Dr. Ayush Dixit'),
        ('founder_title', 'Founder & CEO, VetCrack'),
        ('founder_desc', 'VetCrack was born from a vision to make quality veterinary education accessible to every aspiring professional in India. We combine cutting-edge technology with expert knowledge to create an unparalleled learning experience.'),
        ('founder_image', ''),
        ('founder_exp', '15+ Years Experience'),
        ('founder_degree', 'MVSc, PhD')
      ON CONFLICT (key) DO NOTHING;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tests (
        test_id VARCHAR(64) PRIMARY KEY,
        course_id VARCHAR(64) NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT DEFAULT '',
        duration_minutes INTEGER NOT NULL DEFAULT 30,
        total_questions INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tests_course_id ON tests(course_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS test_questions (
        question_id VARCHAR(64) PRIMARY KEY,
        test_id VARCHAR(64) NOT NULL REFERENCES tests(test_id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('A','B','C','D')),
        "order" INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_test_questions_test_id ON test_questions(test_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS test_attempts (
        attempt_id VARCHAR(64) PRIMARY KEY,
        test_id VARCHAR(64) NOT NULL REFERENCES tests(test_id) ON DELETE CASCADE,
        user_id VARCHAR(128) NOT NULL,
        score INTEGER NOT NULL DEFAULT 0,
        total_questions INTEGER NOT NULL DEFAULT 0,
        answers JSONB DEFAULT '[]',
        attempted_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_test_attempts_test_id ON test_attempts(test_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_test_attempts_user_id ON test_attempts(user_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS faqs (
        faq_id SERIAL PRIMARY KEY,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS medicines (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        generic_name VARCHAR(255) DEFAULT '',
        category VARCHAR(100) DEFAULT '',
        species VARCHAR(100) DEFAULT '',
        dosage TEXT DEFAULT '',
        description TEXT DEFAULT '',
        indications TEXT DEFAULT '',
        contraindications TEXT DEFAULT '',
        side_effects TEXT DEFAULT '',
        brand_names TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS knowledge_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT DEFAULT '',
        icon VARCHAR(100) DEFAULT '',
        thumbnail TEXT DEFAULT '',
        seo_title VARCHAR(255) DEFAULT '',
        seo_description TEXT DEFAULT '',
        status VARCHAR(20) DEFAULT 'active',
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS knowledge_subcategories (
        id SERIAL PRIMARY KEY,
        category_id INTEGER NOT NULL REFERENCES knowledge_categories(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        description TEXT DEFAULT '',
        thumbnail TEXT DEFAULT '',
        seo_title VARCHAR(255) DEFAULT '',
        seo_description TEXT DEFAULT '',
        status VARCHAR(20) DEFAULT 'active',
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(category_id, slug)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_knowledge_subcategories_category_id ON knowledge_subcategories(category_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        slug VARCHAR(500) UNIQUE NOT NULL,
        excerpt TEXT DEFAULT '',
        content JSONB DEFAULT '[]',
        author VARCHAR(255) DEFAULT '',
        category_id INTEGER REFERENCES knowledge_categories(id) ON DELETE SET NULL,
        subcategory_id INTEGER REFERENCES knowledge_subcategories(id) ON DELETE SET NULL,
        featured_image TEXT DEFAULT '',
        tags TEXT DEFAULT '',
        reading_time INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'draft',
        view_count INTEGER DEFAULT 0,
        seo_title VARCHAR(255) DEFAULT '',
        seo_description TEXT DEFAULT '',
        seo_keywords TEXT DEFAULT '',
        og_image TEXT DEFAULT '',
        canonical_url TEXT DEFAULT '',
        published_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles(category_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_articles_subcategory_id ON articles(subcategory_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS diseases (
        id SERIAL PRIMARY KEY,
        name VARCHAR(500) NOT NULL,
        slug VARCHAR(500) UNIQUE NOT NULL,
        overview TEXT DEFAULT '',
        symptoms TEXT DEFAULT '',
        causes TEXT DEFAULT '',
        diagnosis TEXT DEFAULT '',
        treatment TEXT DEFAULT '',
        prevention TEXT DEFAULT '',
        species VARCHAR(255) DEFAULT '',
        images JSONB DEFAULT '[]',
        "references" TEXT DEFAULT '',
        status VARCHAR(20) DEFAULT 'draft',
        view_count INTEGER DEFAULT 0,
        seo_title TEXT DEFAULT '',
        seo_description TEXT DEFAULT '',
        seo_keywords TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_diseases_status ON diseases(status);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS vaccines (
        id SERIAL PRIMARY KEY,
        name VARCHAR(500) NOT NULL,
        slug VARCHAR(500) UNIQUE NOT NULL,
        description TEXT DEFAULT '',
        species VARCHAR(255) DEFAULT '',
        indications TEXT DEFAULT '',
        contraindications TEXT DEFAULT '',
        dosage TEXT DEFAULT '',
        schedule TEXT DEFAULT '',
        route VARCHAR(100) DEFAULT '',
        manufacturer VARCHAR(255) DEFAULT '',
        images JSONB DEFAULT '[]',
        "references" TEXT DEFAULT '',
        status VARCHAR(20) DEFAULT 'draft',
        view_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_vaccines_status ON vaccines(status);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS breeds (
        id SERIAL PRIMARY KEY,
        name VARCHAR(500) NOT NULL,
        slug VARCHAR(500) UNIQUE NOT NULL,
        species VARCHAR(100) DEFAULT '',
        origin TEXT DEFAULT '',
        characteristics TEXT DEFAULT '',
        weight_range VARCHAR(255) DEFAULT '',
        height_range VARCHAR(255) DEFAULT '',
        lifespan VARCHAR(255) DEFAULT '',
        milk_yield TEXT DEFAULT '',
        management TEXT DEFAULT '',
        common_diseases TEXT DEFAULT '',
        images JSONB DEFAULT '[]',
        "references" TEXT DEFAULT '',
        status VARCHAR(20) DEFAULT 'draft',
        view_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_breeds_status ON breeds(status);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_breeds_species ON breeds(species);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS procedures (
        id SERIAL PRIMARY KEY,
        name VARCHAR(500) NOT NULL,
        slug VARCHAR(500) UNIQUE NOT NULL,
        description TEXT DEFAULT '',
        indications TEXT DEFAULT '',
        contraindications TEXT DEFAULT '',
        preparation TEXT DEFAULT '',
        technique TEXT DEFAULT '',
        aftercare TEXT DEFAULT '',
        complications TEXT DEFAULT '',
        species VARCHAR(255) DEFAULT '',
        category VARCHAR(100) DEFAULT '',
        images JSONB DEFAULT '[]',
        "references" TEXT DEFAULT '',
        status VARCHAR(20) DEFAULT 'draft',
        view_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_procedures_status ON procedures(status);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS diagnostic_tests (
        id SERIAL PRIMARY KEY,
        name VARCHAR(500) NOT NULL,
        slug VARCHAR(500) UNIQUE NOT NULL,
        description TEXT DEFAULT '',
        species VARCHAR(255) DEFAULT '',
        sample_type VARCHAR(255) DEFAULT '',
        normal_range TEXT DEFAULT '',
        interpretation TEXT DEFAULT '',
        cost_estimate VARCHAR(255) DEFAULT '',
        images JSONB DEFAULT '[]',
        "references" TEXT DEFAULT '',
        status VARCHAR(20) DEFAULT 'draft',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_diagnostic_tests_status ON diagnostic_tests(status);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(128) NOT NULL,
        title VARCHAR(500) NOT NULL,
        content TEXT DEFAULT '',
        category VARCHAR(100) DEFAULT '',
        tags TEXT DEFAULT '',
        is_public BOOLEAN DEFAULT false,
        view_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS note_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT DEFAULT '',
        icon VARCHAR(100) DEFAULT 'file-text',
        thumbnail TEXT DEFAULT '',
        sort_order INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS note_subcategories (
        id SERIAL PRIMARY KEY,
        category_id INTEGER NOT NULL REFERENCES note_categories(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        description TEXT DEFAULT '',
        sort_order INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(category_id, slug)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS note_pages (
        id SERIAL PRIMARY KEY,
        category_id INTEGER NOT NULL REFERENCES note_categories(id) ON DELETE CASCADE,
        subcategory_id INTEGER REFERENCES note_subcategories(id) ON DELETE SET NULL,
        title VARCHAR(500) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        content TEXT DEFAULT '',
        html_content TEXT DEFAULT '',
        sort_order INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        view_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(category_id, slug)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_note_pages_category ON note_pages(category_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_note_pages_subcategory ON note_pages(subcategory_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS mcqs (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL,
        options JSONB NOT NULL,
        correct_answer VARCHAR(10) NOT NULL,
        explanation TEXT DEFAULT '',
        category VARCHAR(255) DEFAULT '',
        subcategory VARCHAR(255) DEFAULT '',
        difficulty VARCHAR(20) DEFAULT 'medium',
        article_id INTEGER REFERENCES articles(id) ON DELETE SET NULL,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_mcqs_article_id ON mcqs(article_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_mcqs_difficulty ON mcqs(difficulty);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS article_images (
        id SERIAL PRIMARY KEY,
        article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        caption TEXT DEFAULT '',
        alt_text TEXT DEFAULT '',
        layout VARCHAR(20) DEFAULT 'full_width',
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_article_images_article_id ON article_images(article_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS media_library (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(500) NOT NULL,
        original_name VARCHAR(500) NOT NULL,
        url TEXT NOT NULL,
        thumbnail_url TEXT DEFAULT '',
        mime_type VARCHAR(100) DEFAULT '',
        file_size INTEGER DEFAULT 0,
        alt_text TEXT DEFAULT '',
        caption TEXT DEFAULT '',
        uploaded_by VARCHAR(128) DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_media_library_uploaded_by ON media_library(uploaded_by);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS article_comments (
        id SERIAL PRIMARY KEY,
        article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
        user_id VARCHAR(128) NOT NULL,
        user_name VARCHAR(255) DEFAULT '',
        comment TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_article_comments_article_id ON article_comments(article_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_article_comments_user_id ON article_comments(user_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_article_comments_status ON article_comments(status);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS page_views (
        id SERIAL PRIMARY KEY,
        page_type VARCHAR(50) NOT NULL,
        page_id INTEGER NOT NULL,
        user_id VARCHAR(128) DEFAULT '',
        ip_address VARCHAR(45) DEFAULT '',
        user_agent TEXT DEFAULT '',
        viewed_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_page_views_page_type_page_id ON page_views(page_type, page_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS search_logs (
        id SERIAL PRIMARY KEY,
        query TEXT NOT NULL,
        result_count INTEGER DEFAULT 0,
        user_id VARCHAR(128) DEFAULT '',
        searched_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_search_logs_user_id ON search_logs(user_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS drug_relations (
        id SERIAL PRIMARY KEY,
        drug_id INTEGER NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
        related_type VARCHAR(50) NOT NULL,
        related_id INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(drug_id, related_type, related_id)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_drug_relations_drug_id ON drug_relations(drug_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_drug_relations_related ON drug_relations(related_type, related_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS disease_relations (
        id SERIAL PRIMARY KEY,
        disease_id INTEGER NOT NULL REFERENCES diseases(id) ON DELETE CASCADE,
        related_type VARCHAR(50) NOT NULL,
        related_id INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(disease_id, related_type, related_id)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_disease_relations_disease_id ON disease_relations(disease_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_disease_relations_related ON disease_relations(related_type, related_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS article_relations (
        id SERIAL PRIMARY KEY,
        article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
        related_type VARCHAR(50) NOT NULL,
        related_id INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(article_id, related_type, related_id)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_article_relations_article_id ON article_relations(article_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_article_relations_related ON article_relations(related_type, related_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS credit_packages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        credits INTEGER NOT NULL,
        price NUMERIC(10,2) NOT NULL,
        description TEXT DEFAULT '',
        popular BOOLEAN DEFAULT false,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_credits (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(128) NOT NULL UNIQUE REFERENCES users(uid) ON DELETE CASCADE,
        credits NUMERIC(10,1) NOT NULL DEFAULT 0,
        lifetime_used NUMERIC(10,1) NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS credit_transactions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(128) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('grant', 'usage', 'purchase', 'admin')),
        credits NUMERIC(10,1) NOT NULL,
        balance_after NUMERIC(10,1) NOT NULL,
        description TEXT DEFAULT '',
        reference_id VARCHAR(255) DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
    `);

    // Seed default credit packages if table is empty
    const pkgCheck = await client.query('SELECT COUNT(*) FROM credit_packages');
    if (parseInt(pkgCheck.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO credit_packages (name, credits, price, description, popular) VALUES
          ('Starter Pack', 150, 49, 'Perfect for trying out the AI assistant', false),
          ('Popular Pack', 350, 149, 'Best value for regular users', true),
          ('Pro Pack', 500, 299, 'For heavy users and professionals', false),
          ('Unlimited Pack', 2000, 999, 'Unlimited access for serious study', false);
      `);
    }

    await client.query('COMMIT');
    console.log('Database schema initialized successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Schema initialization failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { initSchema };
