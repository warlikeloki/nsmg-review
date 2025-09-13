-- Create database (adjust collation as desired)
CREATE DATABASE IF NOT EXISTS nsmg
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE nsmg;

-- Services (also powers pricing)
CREATE TABLE IF NOT EXISTS services (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  description TEXT         NULL,
  category    VARCHAR(120) NULL,
  unit        VARCHAR(60)  NULL, -- e.g., "per hour", "flat", "per photo"
  is_package  TINYINT(1)   NOT NULL DEFAULT 0,
  price       DECIMAL(10,2) NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_services_cat (category),
  INDEX idx_services_ispkg (is_package),
  INDEX idx_services_name (name)
) ENGINE=InnoDB;

-- Events (upcoming displayed on homepage and events page)
CREATE TABLE IF NOT EXISTS events (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  location    VARCHAR(200) NULL,
  description TEXT         NULL,
  starts_at   DATETIME     NOT NULL,
  ends_at     DATETIME     NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_events_dates (starts_at, ends_at)
) ENGINE=InnoDB;

-- Blog posts (basic; tags is CSV for now)
CREATE TABLE IF NOT EXISTS posts (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  slug         VARCHAR(200) NOT NULL UNIQUE,
  title        VARCHAR(200) NOT NULL,
  teaser       TEXT         NULL,
  content      LONGTEXT     NULL,
  author       VARCHAR(120) NULL,
  tags         VARCHAR(500) NULL, -- CSV for Phase 1; normalize later
  status       ENUM('draft','published') NOT NULL DEFAULT 'published',
  published_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_posts_pub (published_at),
  INDEX idx_posts_status (status)
) ENGINE=InnoDB;

-- Contact messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(200) NOT NULL,
  email     VARCHAR(200) NOT NULL,
  subject   VARCHAR(200) NULL,
  category  VARCHAR(120) NULL,
  message   TEXT         NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contact_email (email),
  INDEX idx_contact_created (created_at)
) ENGINE=InnoDB;
