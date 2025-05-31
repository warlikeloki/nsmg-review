<?php
// php/get_pricing.php

// Enable error reporting for debugging (remove in production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');

// 1) Connect to the database
require_once __DIR__ . '/db_connect.php';  // This file should define and initialize $pdo

try {
    // 2) Fetch all pricing joined with service details
    $sql = <<<SQL
SELECT
  s.id,
  s.name,
  s.description,
  s.unit,
  s.is_package,
  p.price
FROM services s
JOIN pricing p ON p.service_id = s.id
ORDER BY s.is_package, s.name;

SQL;

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3) Return JSON
    echo json_encode($rows, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
    exit;
}
