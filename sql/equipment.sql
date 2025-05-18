CREATE TABLE equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    thumbnail_url VARCHAR(255),

    -- Admin-only fields
    manufacturer VARCHAR(100),
    model_number VARCHAR(100),
    serial_number VARCHAR(100),
    owner VARCHAR(100),  -- e.g., "Neil Smith", "Freelancer X"
    internal_notes TEXT,
    condition ENUM('new', 'good', 'used', 'needs repair', 'retired') DEFAULT 'good',
    is_retired BOOLEAN DEFAULT FALSE,
    last_used_at DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
