-- DROP both tables if they already exist
DROP TABLE IF EXISTS pricing;
DROP TABLE IF EXISTS services;

-- CREATE services table
CREATE TABLE services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,       -- e.g. "Event Photography - Basic Package"
  description TEXT,                 -- human-readable details
  unit VARCHAR(50),                 -- e.g. "per hour", "per image", NULL for packages
  is_package BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                          ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- SEED services table
INSERT INTO services (name, description, unit, is_package) VALUES
-- Photography
('Event Photography - Hourly Rate', 'Weddings, Parties, Corporate Events', 'per hour', FALSE),
('Event Photography - Basic Package', '4 hr coverage; ~100 edited images; online gallery', NULL, TRUE),
('Event Photography - Standard Package', '6 hr coverage; ~150 edited images; gallery; 30 min engagement shoot', NULL, TRUE),
('Event Photography - Premium Package', '8 hr full-day; ~250 edits; gallery; 20-page album; second shooter', NULL, TRUE),
('Portrait Mini Session', '30 min session; 5 edited images', NULL, TRUE),
('Portrait Full Session', '1 hr; 2 outfit changes; 1 location', 'per session', FALSE),
('Product Photography - Per Image', 'Simple studio shots; white background; min 10 images', 'per image', FALSE),
('Product Photography - Hourly Rate', 'Lifestyle or on-location setups', 'per hour', FALSE),
('Product Photography - Day Rate', 'Up to 8 hr complex shoots', 'per day', FALSE),
('Real Estate Photography - Standard', '≤2,000 sq ft; 20–25 photos', NULL, TRUE),
('Real Estate Photography - Large', '2,001–3,000 sq ft; 30–35 photos', NULL, TRUE),
('Real Estate Photography - Oversize', 'Per additional 100 sq ft', 'per 100 sq ft', FALSE),
('Real Estate Drone Add-On', '5–7 aerial images', NULL, TRUE),
('Real Estate 3D Tour Add-On', 'Zillow 3D-style virtual tour', NULL, TRUE),

-- Videography
('Event Videography - Hourly Rate', 'Weddings, Parties, Corporate Events', 'per hour', FALSE),
('Event Videography - Basic Package', '4 hr coverage; 3–5 min highlight reel', NULL, TRUE),
('Event Videography - Standard Package', '6 hr coverage; 5–7 min reel; full ceremony edit', NULL, TRUE),
('Event Videography - Premium Package', '8 hr; 7–10 min cinematic; two-camera; raw footage', NULL, TRUE),
('Short Promo Video', '30–60 sec commercial/promo', NULL, TRUE),
('Brand Story Video', '2–5 min brand video', NULL, TRUE),
('Drone Videography', 'Aerial video (incl. basic editing)', 'per hour', FALSE),

-- Post-Production
('Video Editing - Basic', 'Assembly, color correction, basic audio', 'per hour', FALSE),
('Video Editing - Advanced', 'Motion graphics, sound design; 2 revisions', NULL, TRUE),
('Photo Editing - Basic', 'Batch color/exposure adjustments', 'per image', FALSE),
('Photo Editing - Advanced', 'Skin smoothing, object removal', NULL, TRUE),
('Bulk Photo Editing', 'Basic adjustments for 100 images', NULL, TRUE),
('Color Grading', 'Dedicated grading pass for finished video', 'per minute', FALSE),

-- Audio
('On-Location Audio Recording', '2-channel field kit', 'per hour', FALSE),
('On-Location Audio Day Rate', 'Up to 8 hr recording', 'per day', FALSE),
('Podcast Recording', 'Recording session', 'per hour', FALSE),
('Podcast Editing', 'Audio editing per audio hour', 'per hour', FALSE),
('Voice-Over Recording', 'Finished audio minute', 'per minute', FALSE),

-- Officiant & Notary
('Wedding Officiant - Standard', 'Custom ceremony; license filing', NULL, TRUE),
('Officiant Elopement', 'Simple ceremony; license filing', NULL, TRUE),
('Officiant Rehearsal', 'Rehearsal attendance', 'per hour', FALSE),
('Notary Act', 'Per signature/act (VA only)', 'per act', FALSE),
('Notary Travel Fee', 'Beyond 10-mile radius', 'per mile', FALSE);
