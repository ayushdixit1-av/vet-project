export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  thumbnail: string;
  seo_title: string;
  seo_description: string;
  status: string;
  sort_order: number;
  article_count?: number;
  subcategory_count?: number;
  subcategories?: Subcategory[];
  created_at: string;
  updated_at: string;
}

export interface Subcategory {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string;
  thumbnail: string;
  seo_title: string;
  seo_description: string;
  status: string;
  sort_order: number;
  category_name?: string;
  article_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ArticleBlock {
  id: string;
  type: 'heading' | 'paragraph' | 'image' | 'gallery' | 'video' | 'quote' | 'table' | 'faq' | 'reference' | 'callout' | 'drug-reference' | 'disease-reference' | 'mcq' | 'download' | 'code' | 'divider';
  content: any;
  attrs?: Record<string, any>;
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: ArticleBlock[];
  author: string;
  category_id: number;
  subcategory_id: number;
  featured_image: string;
  tags: string;
  reading_time: number;
  status: string;
  view_count: number;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  og_image: string;
  canonical_url: string;
  published_at: string;
  category_name?: string;
  subcategory_name?: string;
  category_slug?: string;
  subcategory_slug?: string;
  created_at: string;
  updated_at: string;
}

export interface Drug {
  id: number;
  name: string;
  slug?: string;
  generic_name: string;
  category: string;
  species: string;
  dosage: string;
  description: string;
  indications: string;
  contraindications: string;
  side_effects: string;
  brand_names: string;
  drug_class?: string;
  route?: string;
  prescription_status?: string;
  images?: string[];
  references?: string;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface Disease {
  id: number;
  name: string;
  slug: string;
  overview: string;
  symptoms: string;
  causes: string;
  diagnosis: string;
  treatment: string;
  prevention: string;
  species: string;
  images: string[];
  references: string;
  status: string;
  view_count: number;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  created_at: string;
  updated_at: string;
}

export interface Breed {
  id: number;
  name: string;
  slug: string;
  species: string;
  origin: string;
  characteristics: string;
  weight_range: string;
  height_range: string;
  lifespan: string;
  milk_yield: string;
  management: string;
  common_diseases: string;
  images: string[];
  references: string;
  status: string;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface Vaccine {
  id: number;
  name: string;
  slug: string;
  description: string;
  species: string;
  indications: string;
  contraindications: string;
  dosage: string;
  schedule: string;
  route: string;
  manufacturer: string;
  images: string[];
  references: string;
  status: string;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface Procedure {
  id: number;
  name: string;
  slug: string;
  description: string;
  indications: string;
  contraindications: string;
  preparation: string;
  technique: string;
  aftercare: string;
  complications: string;
  species: string;
  category: string;
  images: string[];
  references: string;
  status: string;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface DiagnosticTest {
  id: number;
  name: string;
  slug: string;
  description: string;
  species: string;
  sample_type: string;
  normal_range: string;
  interpretation: string;
  cost_estimate: string;
  images: string[];
  references: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: number;
  user_id: string;
  title: string;
  content: string;
  category: string;
  tags: string;
  is_public: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface MCQ {
  id: number;
  question: string;
  options: { label: string; text: string }[];
  correct_answer: string;
  explanation: string;
  category: string;
  subcategory: string;
  difficulty: string;
  article_id: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MediaItem {
  id: number;
  filename: string;
  original_name: string;
  url: string;
  thumbnail_url: string;
  mime_type: string;
  file_size: number;
  alt_text: string;
  caption: string;
  uploaded_by: string;
  created_at: string;
}

export interface User {
  uid: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface SearchResults {
  articles: Article[];
  drugs: Drug[];
  diseases: Disease[];
  breeds: Breed[];
  procedures: Procedure[];
  vaccines: Vaccine[];
  notes: Note[];
  courses: any[];
}

export interface DashboardStats {
  total_articles: number;
  total_drugs: number;
  total_diseases: number;
  total_breeds: number;
  total_categories: number;
  total_users: number;
  total_courses: number;
  total_procedures: number;
  total_vaccines: number;
}
