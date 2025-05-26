<?php
// php/db_connect.php
// Centralized PDO database connection

// --- UPDATE THESE VARIABLES WITH YOUR DATABASE CREDENTIALS ---
$host    = 'localhost';       // e.g. '127.0.0.1' or RDS endpoint
$db      = 'nsmg_db';
$user    = 'nsmg_user';
$pass    = 'JordynIsmyf@v0rite';
$charset = 'utf8mb4';

// Optional: Set default timezone for application
date_default_timezone_set('America/New_York');

// Data Source Name (DSN)
$dsn = "mysql:host=$host;dbname=$db;charset=$charset";

// PDO options for robust error handling and security
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    // Create PDO instance
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    // On connection failure, return JSON error and halt
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error'   => 'Database connection failed',
        'message' => $e->getMessage()
    ]);
    exit;
}
?>
