CREATE TABLE service_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(50),
  services JSON NOT NULL,          -- e.g. ["Photography","Editing"]
  preferred_date DATE,
  location VARCHAR(255),
  duration VARCHAR(100),
  details TEXT NOT NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CHECK (JSON_VALID(services)),
  INDEX idx_requests_email (email),
  INDEX idx_requests_submitted (submitted_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
