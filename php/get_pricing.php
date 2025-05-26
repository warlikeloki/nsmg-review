<?php
// php/get_pricing.php

header('Content-Type: application/json; charset=utf-8');

// 1) Connect to the database
require_once __DIR__ . '/db_connect.php';  // assumes $pdo is your PDO instance

// 2) Fetch all pricing joined with service details
$sql = <<<SQL
SELECT
  s.name         AS service,
  s.description  AS description,
  p.price        AS price,
  p.unit         AS unit,
  p.is_package   AS is_package
FROM pricing p
JOIN services s
  ON p.service_id = s.id
ORDER BY p.is_package DESC, s.name
SQL;

$stmt = $pdo->prepare($sql);
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

// 3) Return JSON
echo json_encode($rows, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);

