<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db_connect.php';

try {
    // Initialize PDO
    $pdo = new PDO($dsn, $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

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
ORDER BY p.is_package DESC, s.name
SQL;

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($rows, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
//--- /php/get_pricing.php (Issue #49) ---