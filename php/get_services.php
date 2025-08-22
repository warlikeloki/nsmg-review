<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/util.php';

require_method('GET');

$limit     = max(0, get_int($_GET, 'limit', 0)); // 0 = no limit
$category  = get_str($_GET, 'category', '');
$isPackage = get_str($_GET, 'is_package', '');   // '', '0', or '1'
$search    = get_str($_GET, 'q', '');

$sql = "SELECT s.id, s.name, s.description, s.category, s.unit, s.is_package,
               p.price
        FROM services s
        LEFT JOIN pricing p ON p.service_id = s.id
        WHERE 1=1";
$params = [];

if ($category !== '') {
    $sql .= " AND s.category = :category";
    $params[':category'] = $category;
}

if ($isPackage === '0' || $isPackage === '1') {
    $sql .= " AND s.is_package = :is_package";
    $params[':is_package'] = (int)$isPackage;
}

if ($search !== '') {
    $sql .= " AND (s.name LIKE :q OR s.description LIKE :q)";
    $params[':q'] = "%{$search}%";
}

$sql .= " ORDER BY s.name ASC";
if ($limit > 0) {
    $sql .= " LIMIT :limit";
}

try {
    $pdo = db();
    $stmt = $pdo->prepare($sql);
    foreach ($params as $k => $v) {
        $stmt->bindValue($k, $v);
    }
    if ($limit > 0) {
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    }
    $stmt->execute();
    $rows = $stmt->fetchAll();
    json_response(true, $rows);
} catch (Throwable $e) {
    json_response(false, null, APP_DEBUG ? $e->getMessage() : 'Failed to load services', 500);
}
