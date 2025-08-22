<?php
/**
 * /includes/db.php
 * Central PDO connection loader. Requires the secure config outside web root.
 * Adjust the require_once path to include your actual cPanel username.
 */

require_once '/home/fh5494bhswi9/secure-config/config.php'; // <-- replace CPANELUSER

function db(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (Throwable $e) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'error'   => APP_DEBUG ? $e->getMessage() : 'Database connection failed'
        ]);
        exit;
    }
}
