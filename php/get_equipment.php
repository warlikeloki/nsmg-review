<?php
header("Content-Type: application/json; charset=utf-8");
require_once __DIR__ . '/db_connect.php';

try {
    // Ensure we have a category (type) filter
    $category = $_GET['category'] ?? '';
    if (empty($category)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Missing category parameter."]);
        exit;
    }

    // Prepare and execute SQL: join equipment with types, filter by slug
    $sql = <<<SQL
SELECT
  e.id,
  e.name,
  e.description,
  e.category,
  et.slug AS type
FROM equipment e
JOIN equipment_to_types ett ON e.id = ett.equipment_id
JOIN equipment_types et ON ett.type_id = et.id
WHERE et.slug = :category
ORDER BY e.category, e.name
SQL;

    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':category', $category);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Return the filtered list
    echo json_encode($rows, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}

//--- /php/get_equipment.php (Issue #46) ---