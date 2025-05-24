CREATE TABLE invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    client_name VARCHAR(150) NOT NULL,
    client_email VARCHAR(150) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('draft','sent','paid','overdue') DEFAULT 'draft',
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
