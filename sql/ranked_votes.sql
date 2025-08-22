CREATE TABLE ranked_votes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ballot_id INT NOT NULL,
  rankings JSON NOT NULL, -- e.g., ["Alex","Jordan","Taylor"]
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CHECK (JSON_VALID(rankings)),
  INDEX idx_votes_ballot_id (ballot_id),
  CONSTRAINT fk_votes_ballot
    FOREIGN KEY (ballot_id) REFERENCES ranked_ballots(id)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
