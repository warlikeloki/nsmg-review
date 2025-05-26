<?php
header("Content-Type: application/json");
require_once __DIR__ . '/db_connect.php';

try {
    $file = __DIR__ . '/../json/posts.json';
    if (!file_exists($file)) {
        throw new Exception("posts.json not found");
    }

    $posts = json_decode(file_get_contents($file), true);
    if (!is_array($posts)) {
        throw new Exception("Invalid JSON format in posts.json");
    }

    echo json_encode([
        "success" => true,
        "data"    => $posts
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
