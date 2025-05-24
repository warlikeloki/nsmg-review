CREATE TABLE website_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_title VARCHAR(255) NOT NULL,
  meta_description TEXT,
  contact_email VARCHAR(150),
  facebook_url VARCHAR(255),
  instagram_url VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

/* Optional: seed a default row */
INSERT INTO website_settings 
  (site_title, meta_description, contact_email, facebook_url, instagram_url)
VALUES 
  ('Neil Smith Media Group', 
   'Photography, Videography, and Media Solutions.', 
   'contact@neilsmith.org', 
   'https://www.facebook.com/NeilSmithMedia', 
   'https://www.instagram.com/NeilSmithMedia');
