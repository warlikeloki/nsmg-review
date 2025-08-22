<?php
header("Content-Type: application/json");
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/util.php';

try {
    // For now we load from the JSON file; later you can switch to a DB query
    $file = __DIR__ . '/../json/testimonials.json';
    if (!file_exists($file)) {
        throw new Exception("Testimonials data not found.");
    }
    $testimonials = json_decode(file_get_contents($file), true);

    echo json_encode([
        "success" => true,
        "data"    => $testimonials
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
