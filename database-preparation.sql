-- ============================================
-- KCT MENSWEAR DATABASE PREPARATION
-- For Optimized CSV Import & Collections System
-- ============================================

-- 1. ENHANCE PRODUCTS TABLE
-- Add missing columns for better categorization and search
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS master_category VARCHAR(100),
ADD COLUMN IF NOT EXISTS subcategory VARCHAR(100),
ADD COLUMN IF NOT EXISTS collection VARCHAR(100),
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS smart_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS color_family VARCHAR(50),
ADD COLUMN IF NOT EXISTS occasions TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS materials TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS search_keywords TEXT,
ADD COLUMN IF NOT EXISTS ai_score INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS trending BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS seasonal VARCHAR(20),
ADD COLUMN IF NOT EXISTS fit_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS style_profile VARCHAR(50),
ADD COLUMN IF NOT EXISTS bundle_components JSONB,
ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS size_chart JSONB,
ADD COLUMN IF NOT EXISTS care_instructions TEXT,
ADD COLUMN IF NOT EXISTS import_batch VARCHAR(50),
ADD COLUMN IF NOT EXISTS csv_row_number INTEGER,
ADD COLUMN IF NOT EXISTS last_synced TIMESTAMP WITH TIME ZONE;

-- 2. CREATE COLLECTIONS TABLE
-- Dynamic collections management
CREATE TABLE IF NOT EXISTS collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES collections(id),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  meta_title VARCHAR(200),
  meta_description TEXT,
  product_count INTEGER DEFAULT 0,
  filters JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CREATE PRODUCT_COLLECTIONS JUNCTION TABLE
-- Many-to-many relationship
CREATE TABLE IF NOT EXISTS product_collections (
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (product_id, collection_id)
);

-- 4. CREATE CATEGORIES TABLE
-- Master categories and subcategories
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  parent_id UUID REFERENCES categories(id),
  level INTEGER DEFAULT 0,
  path TEXT, -- e.g., "suits/two-piece/modern-fit"
  image_url TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  product_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CREATE IMPORT_LOGS TABLE
-- Track CSV imports
CREATE TABLE IF NOT EXISTS import_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id VARCHAR(50) NOT NULL,
  file_name VARCHAR(200),
  total_rows INTEGER,
  successful_rows INTEGER,
  failed_rows INTEGER,
  errors JSONB DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- 6. CREATE COLOR_MAPPINGS TABLE
-- For smart color search
CREATE TABLE IF NOT EXISTS color_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  color_name VARCHAR(100) UNIQUE NOT NULL,
  color_family VARCHAR(50) NOT NULL,
  hex_code VARCHAR(7),
  synonyms TEXT[] DEFAULT '{}',
  is_primary BOOLEAN DEFAULT FALSE
);

-- 7. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_products_master_category ON products(master_category);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory);
CREATE INDEX IF NOT EXISTS idx_products_collection ON products(collection);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_products_smart_tags ON products USING GIN(smart_tags);
CREATE INDEX IF NOT EXISTS idx_products_occasions ON products USING GIN(occasions);
CREATE INDEX IF NOT EXISTS idx_products_materials ON products USING GIN(materials);
CREATE INDEX IF NOT EXISTS idx_products_color_family ON products(color_family);
CREATE INDEX IF NOT EXISTS idx_products_trending ON products(trending) WHERE trending = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING GIN(to_tsvector('english', search_keywords));
CREATE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_path ON categories(path);

-- 8. FULL-TEXT SEARCH CONFIGURATION
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Update search vector
UPDATE products 
SET search_vector = to_tsvector('english',
  COALESCE(name, '') || ' ' ||
  COALESCE(description, '') || ' ' ||
  COALESCE(category, '') || ' ' ||
  COALESCE(master_category, '') || ' ' ||
  COALESCE(subcategory, '') || ' ' ||
  COALESCE(search_keywords, '') || ' ' ||
  COALESCE(array_to_string(tags, ' '), '') || ' ' ||
  COALESCE(array_to_string(smart_tags, ' '), '')
);

-- Create trigger to update search vector
CREATE OR REPLACE FUNCTION update_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.name, '') || ' ' ||
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.category, '') || ' ' ||
    COALESCE(NEW.master_category, '') || ' ' ||
    COALESCE(NEW.subcategory, '') || ' ' ||
    COALESCE(NEW.search_keywords, '') || ' ' ||
    COALESCE(array_to_string(NEW.tags, ' '), '') || ' ' ||
    COALESCE(array_to_string(NEW.smart_tags, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_search_vector 
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- Create search index
CREATE INDEX IF NOT EXISTS idx_products_search_vector ON products USING GIN(search_vector);

-- 9. POPULATE COLOR MAPPINGS
INSERT INTO color_mappings (color_name, color_family, hex_code, synonyms, is_primary) VALUES
('navy', 'blue', '#000080', ARRAY['navy blue', 'dark blue', 'midnight'], true),
('royal-blue', 'blue', '#4169E1', ARRAY['royal', 'bright blue'], false),
('black', 'black', '#000000', ARRAY['onyx', 'jet', 'ebony'], true),
('charcoal', 'grey', '#36454F', ARRAY['dark grey', 'charcoal grey'], false),
('grey', 'grey', '#808080', ARRAY['gray', 'silver'], true),
('burgundy', 'red', '#800020', ARRAY['wine', 'maroon', 'bordeaux'], false),
('white', 'white', '#FFFFFF', ARRAY['ivory', 'cream', 'off-white'], true),
('brown', 'brown', '#964B00', ARRAY['chocolate', 'coffee'], true),
('tan', 'brown', '#D2B48C', ARRAY['beige', 'khaki', 'sand'], false),
('emerald', 'green', '#50C878', ARRAY['emerald green', 'jewel green'], false),
('forest-green', 'green', '#228B22', ARRAY['forest', 'hunter green'], false)
ON CONFLICT (color_name) DO NOTHING;

-- 10. POPULATE INITIAL COLLECTIONS
INSERT INTO collections (slug, name, description, display_order) VALUES
('suits', 'Suits', 'Premium men''s suits for every occasion', 1),
('shirts', 'Shirts', 'Dress shirts and formal wear', 2),
('ties', 'Ties & Accessories', 'Ties, bow ties, and accessories', 3),
('wedding', 'Wedding', 'Complete wedding party solutions', 4),
('prom', 'Prom', 'Stand out at your special night', 5),
('bundles', 'Outfit Bundles', 'Complete outfit packages', 6)
ON CONFLICT (slug) DO NOTHING;

-- 11. STORED PROCEDURES FOR COLLECTIONS

-- Update product counts for collections
CREATE OR REPLACE FUNCTION update_collection_counts() RETURNS void AS $$
BEGIN
  UPDATE collections c
  SET product_count = (
    SELECT COUNT(DISTINCT pc.product_id)
    FROM product_collections pc
    JOIN products p ON p.id = pc.product_id
    WHERE pc.collection_id = c.id
    AND p.status = 'active'
    AND p.visibility = true
  );
END;
$$ LANGUAGE plpgsql;

-- Auto-assign products to collections based on rules
CREATE OR REPLACE FUNCTION auto_assign_collections() RETURNS void AS $$
BEGIN
  -- Clear existing auto-assignments
  DELETE FROM product_collections WHERE product_id IN (
    SELECT id FROM products WHERE import_batch IS NOT NULL
  );
  
  -- Assign suits
  INSERT INTO product_collections (product_id, collection_id)
  SELECT p.id, c.id
  FROM products p, collections c
  WHERE c.slug = 'suits'
  AND (p.master_category ILIKE '%suit%' OR p.category ILIKE '%suit%')
  ON CONFLICT DO NOTHING;
  
  -- Assign shirts
  INSERT INTO product_collections (product_id, collection_id)
  SELECT p.id, c.id
  FROM products p, collections c
  WHERE c.slug = 'shirts'
  AND (p.master_category ILIKE '%shirt%' OR p.category ILIKE '%shirt%')
  ON CONFLICT DO NOTHING;
  
  -- Assign wedding items
  INSERT INTO product_collections (product_id, collection_id)
  SELECT p.id, c.id
  FROM products p, collections c
  WHERE c.slug = 'wedding'
  AND ('wedding' = ANY(p.occasions) OR p.tags @> ARRAY['wedding'])
  ON CONFLICT DO NOTHING;
  
  -- Assign prom items
  INSERT INTO product_collections (product_id, collection_id)
  SELECT p.id, c.id
  FROM products p, collections c
  WHERE c.slug = 'prom'
  AND ('prom' = ANY(p.occasions) OR p.tags @> ARRAY['prom'])
  ON CONFLICT DO NOTHING;
  
  -- Update counts
  PERFORM update_collection_counts();
END;
$$ LANGUAGE plpgsql;

-- 12. HELPER FUNCTIONS

-- Get collection hierarchy
CREATE OR REPLACE FUNCTION get_collection_tree(parent_slug VARCHAR DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  slug VARCHAR,
  name VARCHAR,
  level INTEGER,
  path TEXT,
  product_count INTEGER
) AS $$
WITH RECURSIVE collection_tree AS (
  SELECT 
    c.id,
    c.slug,
    c.name,
    0 as level,
    c.slug as path,
    c.product_count
  FROM collections c
  WHERE (parent_slug IS NULL AND c.parent_id IS NULL) 
     OR (parent_slug IS NOT NULL AND c.slug = parent_slug)
  
  UNION ALL
  
  SELECT 
    c.id,
    c.slug,
    c.name,
    ct.level + 1,
    ct.path || '/' || c.slug,
    c.product_count
  FROM collections c
  JOIN collection_tree ct ON c.parent_id = ct.id
)
SELECT * FROM collection_tree
ORDER BY level, display_order;
$$ LANGUAGE sql;

-- 13. VIEWS FOR EASIER QUERYING

-- Product with all details view
CREATE OR REPLACE VIEW products_full AS
SELECT 
  p.*,
  COALESCE(
    (SELECT json_agg(json_build_object(
      'id', c.id,
      'slug', c.slug,
      'name', c.name
    ))
    FROM collections c
    JOIN product_collections pc ON pc.collection_id = c.id
    WHERE pc.product_id = p.id
  ), '[]'::json) as collections,
  COALESCE(
    (SELECT json_agg(pi.image_url ORDER BY pi.display_order)
    FROM product_images pi
    WHERE pi.product_id = p.id
  ), '[]'::json) as all_images
FROM products p;

-- Collection statistics view
CREATE OR REPLACE VIEW collection_stats AS
SELECT 
  c.slug,
  c.name,
  c.product_count,
  COUNT(DISTINCT p.color_family) as color_count,
  MIN(p.base_price) as min_price,
  MAX(p.base_price) as max_price,
  AVG(p.base_price) as avg_price
FROM collections c
LEFT JOIN product_collections pc ON pc.collection_id = c.id
LEFT JOIN products p ON p.id = pc.product_id
WHERE p.status = 'active'
GROUP BY c.id, c.slug, c.name, c.product_count;

-- 14. GRANT PERMISSIONS
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- 15. SUCCESS MESSAGE
DO $$
BEGIN
  RAISE NOTICE 'Database preparation complete!';
  RAISE NOTICE 'Ready for CSV import with enhanced structure';
  RAISE NOTICE 'Collections system initialized';
  RAISE NOTICE 'Search and indexing configured';
END $$;