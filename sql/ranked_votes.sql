CREATE TABLE ranked_votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ballot_id INT NOT NULL,
    rankings JSON NOT NULL, -- e.g., ["Alex", "Jordan", "Taylor"]
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ballot_id) REFERENCES ranked_ballots(id) ON DELETE CASCADE
);
