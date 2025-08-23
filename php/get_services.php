<?php
// /php/get_services.php (normalized: services + pricing)
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/util.php';

nsmg_nocache();
require_method('GET');

$limit     = max(0, get_int($_GET, 'limit', 0)); // 0 = no limit
$isPackage = get_str($_GET, 'is_package', '');   // '', '0', or '1'
$search    = get_str($_GET, 'q', '');            // optional search

$sql = "SELECT s.id, s.name, s.description, s.unit, s.is_package,
               p.price
        FROM services s
        LEFT JOIN pricing p ON p.service_id = s.id
        WHERE 1=1";
$params = [];

if ($isPackage !== '' && ($isPackage === '0' || $isPackage === '1')) {
    $sql .= " AND s.is_package = :is_package";
    $params[':is_package'] = (int)$isPackage;
}

if ($search !== '') {
    $sql .= " AND (s.name LIKE :q OR s.description LIKE :q)";
    $params[':q'] = "%{$search}%";
}

$sql .= " ORDER BY s.is_package DESC, s.name ASC";
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
    json_response(true, $stmt->fetchAll());
} catch (Throwable $e) {
    json_response(false, null, APP_DEBUG ? $e->getMessage() : 'Failed to load services', 500);
}
