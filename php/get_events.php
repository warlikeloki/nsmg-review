<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/util.php';

require_method('GET');

$limit = max(0, get_int($_GET, 'limit', 10));

$sql = "SELECT id, title, location, description,
               starts_at, ends_at
        FROM events
        WHERE (ends_at IS NULL AND starts_at >= CURRENT_DATE())
           OR (ends_at IS NOT NULL AND ends_at >= CURRENT_DATE())
        ORDER BY starts_at ASC";

if ($limit > 0) {
    $sql .= " LIMIT :limit";
}

try {
    $pdo = db();
    $stmt = $pdo->prepare($sql);
    if ($limit > 0) {
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    }
    $stmt->execute();
    json_response(true, $stmt->fetchAll());
} catch (Throwable $e) {
    json_response(false, null, APP_DEBUG ? $e->getMessage() : 'Failed to load events', 500);
}
