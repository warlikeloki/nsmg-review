CREATE TABLE equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150)         NOT NULL,
    category VARCHAR(50)      NOT NULL,
    description TEXT,
    thumbnail_url VARCHAR(255),

    manufacturer   VARCHAR(100),
    model_number   VARCHAR(100),
    serial_number  VARCHAR(100),
    owner          VARCHAR(100),
    internal_notes TEXT,
    `condition`    ENUM(
                       'new',
                       'good',
                       'used',
                       'needs repair',
                       'retired'
                   ) DEFAULT 'good',
    is_retired     BOOLEAN    DEFAULT FALSE,
    last_used_at   DATE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
