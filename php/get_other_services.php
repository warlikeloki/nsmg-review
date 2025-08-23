<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/util.php';

nsmg_nocache();
require_method('GET');

try {
    $pdo = db();
    $stmt = $pdo->query("
        SELECT id, title, description
        FROM other_services
        ORDER BY id ASC
    ");
    $rows = $stmt->fetchAll();
    json_response(true, $rows);
} catch (Throwable $e) {
    json_response(false, null, APP_DEBUG ? $e->getMessage() : 'Failed to load other services', 500);
}
