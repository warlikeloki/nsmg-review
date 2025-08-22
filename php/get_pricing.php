<?php
// /php/get_pricing.php  — normalized: services + pricing
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/util.php';

require_method('GET');

try {
    $pdo = db();

    $q = "SELECT s.id, s.name, s.description, s.unit, s.is_package, p.price
          FROM services s
          INNER JOIN pricing p ON p.service_id = s.id
          ORDER BY s.is_package DESC, s.name ASC";

    $stmt = $pdo->query($q);
    $rows = $stmt->fetchAll();

    // Split into packages vs à la carte on the server
    $packages = [];
    $alacarte = [];
    foreach ($rows as $r) {
        if ((int)$r['is_package'] === 1) { $packages[] = $r; }
        else { $alacarte[] = $r; }
    }

    json_response(true, ['packages' => $packages, 'alacarte' => $alacarte]);
} catch (Throwable $e) {
    json_response(false, null, APP_DEBUG ? $e->getMessage() : 'Failed to load pricing', 500);
}
