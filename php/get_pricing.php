<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db_connect.php';

try {
    // New SQL: only include pricing for services where s.active = 1
    $sql = <<<SQL
SELECT
  s.name        AS service,
  s.description AS description,
  p.price       AS price,
  p.unit        AS unit,
  p.is_package  AS is_package
FROM pricing p
JOIN services s
  ON p.service_id = s.id
WHERE s.active = 1
ORDER BY p.is_package DESC, s.name
SQL;

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($rows, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Server error."
    ]);
}