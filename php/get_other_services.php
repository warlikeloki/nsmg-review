<?php
header("Content-Type: application/json; charset=utf-8");
require_once __DIR__ . '/db_connect.php';

try {
    $stmt = $pdo->query("
        SELECT id, title, description
        FROM other_services
        ORDER BY id ASC
    ");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "data"    => $rows
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Server error: " . $e->getMessage()
    ]);
}
