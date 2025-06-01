<?php
require 'db_connect.php';
try {
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Tables found: " . implode(', ', $tables);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
