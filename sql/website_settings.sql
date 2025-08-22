CREATE TABLE IF NOT EXISTS website_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_title VARCHAR(255) NOT NULL,
  meta_description TEXT,
  contact_email VARCHAR(150),
  facebook_url VARCHAR(255),
  instagram_url VARCHAR(255),
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- Seed only if table is empty
INSERT INTO website_settings (site_title, meta_description, contact_email, facebook_url, instagram_url)
SELECT
  'Neil Smith Media Group',
  'Photography, Videography, and Media Solutions.',
  'contact@neilsmith.org',
  'https://www.facebook.com/NeilSmithMedia',
  'https://www.instagram.com/NeilSmithMedia'
WHERE NOT EXISTS (SELECT 1 FROM website_settings LIMIT 1);
