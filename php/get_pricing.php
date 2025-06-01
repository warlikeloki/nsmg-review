<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
require_once 'db_connect.php';


try {
    // New SQL: only include pricing for services where s.active = 1
    $sql = <<<SQL
SELECT
  s.name AS service,
  s.description,
  s.unit,
  s.is_package,
  p.price

FROM pricing p
JOIN services s
  ON p.service_id = s.id
WHERE s.active = 1
ORDER BY s.is_package DESC, s.name
SQL;

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($rows, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
} 
catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
