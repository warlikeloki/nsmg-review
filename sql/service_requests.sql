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
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
