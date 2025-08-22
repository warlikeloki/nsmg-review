<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/util.php';

require_method('GET');

try {
    $pdo = db();

    $q = "SELECT s.id, s.name, s.description, s.unit, p.price
          FROM services s
          LEFT JOIN pricing p ON p.service_id = s.id
          WHERE s.is_package = :flag
          ORDER BY s.name ASC";

    $pkg = $pdo->prepare($q);
    $pkg->execute([':flag' => 1]);
    $packages = $pkg->fetchAll();

    $ala = $pdo->prepare($q);
    $ala->execute([':flag' => 0]);
    $alacarte = $ala->fetchAll();

    json_response(true, ['packages' => $packages, 'alacarte' => $alacarte]);
} catch (Throwable $e) {
    json_response(false, null, APP_DEBUG ? $e->getMessage() : 'Failed to load pricing', 500);
}
