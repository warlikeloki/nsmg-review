<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/util.php';

require_method('GET');

$category = get_str($_GET, 'category', '');

if ($category === '') {
    json_response(false, null, 'Missing category parameter.', 400);
}

$sql = "SELECT id, name, description, category
        FROM equipment
        WHERE category = :category
        ORDER BY name ASC";

try {
    $pdo = db();
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':category' => $category]);
    json_response(true, $stmt->fetchAll());
} catch (Throwable $e) {
    json_response(false, null, APP_DEBUG ? $e->getMessage() : 'Failed to load equipment', 500);
}
