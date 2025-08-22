-- DROP & CREATE pricing table
DROP TABLE IF EXISTS pricing;
CREATE TABLE pricing (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_pricing_service
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  UNIQUE KEY uq_pricing_service (service_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- SEED pricing table
INSERT INTO pricing (service_id, price) VALUES
-- Photography
((SELECT id FROM services WHERE name='Event Photography - Hourly Rate'), 175.00),
((SELECT id FROM services WHERE name='Event Photography - Basic Package'), 900.00),
((SELECT id FROM services WHERE name='Event Photography - Standard Package'), 1550.00),
((SELECT id FROM services WHERE name='Event Photography - Premium Package'), 2200.00),
((SELECT id FROM services WHERE name='Portrait Mini Session'), 125.00),
((SELECT id FROM services WHERE name='Portrait Full Session'), 175.00),
((SELECT id FROM services WHERE name='Product Photography - Per Image'), 15.00),
((SELECT id FROM services WHERE name='Product Photography - Hourly Rate'), 125.00),
((SELECT id FROM services WHERE name='Product Photography - Day Rate'), 850.00),
((SELECT id FROM services WHERE name='Real Estate Photography - Standard'), 175.00),
((SELECT id FROM services WHERE name='Real Estate Photography - Large'), 250.00),
((SELECT id FROM services WHERE name='Real Estate Photography - Oversize'), 12.00),
((SELECT id FROM services WHERE name='Real Estate Drone Add-On'), 200.00),
((SELECT id FROM services WHERE name='Real Estate 3D Tour Add-On'), 100.00),

-- Videography
((SELECT id FROM services WHERE name='Event Videography - Hourly Rate'), 200.00),
((SELECT id FROM services WHERE name='Event Videography - Basic Package'), 1200.00),
((SELECT id FROM services WHERE name='Event Videography - Standard Package'), 1650.00),
((SELECT id FROM services WHERE name='Event Videography - Premium Package'), 2400.00),
((SELECT id FROM services WHERE name='Short Promo Video'), 600.00),
((SELECT id FROM services WHERE name='Brand Story Video'), 1200.00),
((SELECT id FROM services WHERE name='Drone Videography'), 200.00),

-- Post-Production
((SELECT id FROM services WHERE name='Video Editing - Basic'), 75.00),
((SELECT id FROM services WHERE name='Video Editing - Advanced'), 350.00),
((SELECT id FROM services WHERE name='Photo Editing - Basic'), 5.00),
((SELECT id FROM services WHERE name='Photo Editing - Advanced'), 20.00),
((SELECT id FROM services WHERE name='Bulk Photo Editing'), 175.00),
((SELECT id FROM services WHERE name='Color Grading'), 75.00),

-- Audio
((SELECT id FROM services WHERE name='On-Location Audio Recording'), 75.00),
((SELECT id FROM services WHERE name='On-Location Audio Day Rate'), 500.00),
((SELECT id FROM services WHERE name='Podcast Recording'), 60.00),
((SELECT id FROM services WHERE name='Podcast Editing'), 50.00),
((SELECT id FROM services WHERE name='Voice-Over Recording'), 50.00),

-- Officiant & Notary
((SELECT id FROM services WHERE name='Wedding Officiant - Standard'), 350.00),
((SELECT id FROM services WHERE name='Officiant Elopement'), 200.00),
((SELECT id FROM services WHERE name='Officiant Rehearsal'), 100.00),
((SELECT id FROM services WHERE name='Notary Act'), 5.00),
((SELECT id FROM services WHERE name='Notary Travel Fee'), 30.00);
