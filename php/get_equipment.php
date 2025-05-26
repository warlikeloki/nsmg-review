<?php
// /php/get_equipment.php

header('Content-Type: application/json; charset=utf-8');

// 1) Connect to the database
require_once __DIR__ . '/db_connect.php';  
// (Assumes db_connect.php sets up a PDO $pdo)

// 2) Read & sanitize category
$category = isset($_GET['category']) ? trim($_GET['category']) : '';
if (empty($category)) {
    echo json_encode([]);
    exit;
}

// 3) Query for equipment in that category
$sql = "
  SELECT 
    e.id,
    e.name,
    e.category,
    e.description,
    e.image_url,
    e.quantity
  FROM equipment AS e
  JOIN equipment_to_types AS et ON e.id = et.equipment_id
  JOIN equipment_types      AS t  ON et.type_id = t.id
  WHERE t.slug = :category
  ORDER BY e.name
";
$stmt = $pdo->prepare($sql);
$stmt->execute(['category' => $category]);
$items = $stmt->fetchAll(PDO::FETCH_ASSOC);

// 4) Output JSON
echo json_encode($items, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);