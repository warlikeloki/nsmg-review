<?php
header("Content-Type: application/json");
require_once __DIR__ . '/db_connect.php';

try {
    $pdo = new PDO($dsn, $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    $stmt = $pdo->query("
      SELECT 
        id, name, category, owner, `condition`, is_retired, last_used_at, created_at 
      FROM equipment
      ORDER BY name
    ");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
      "success" => true,
      "data"    => $rows
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
      "success" => false,
      "message" => "Server error."
    ]);
}
