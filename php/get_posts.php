<?php
header("Content-Type: application/json");
require_once __DIR__ . '/db_connect.php';

try {
  // If you have a posts table, replace this JSON logic with a SELECT query.
  $posts = json_decode(file_get_contents(__DIR__ . '/../json/posts.json'), true);

  echo json_encode([
    "success" => true,
    "data"    => $posts
  ]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode([
    "success" => false,
    "message" => "Could not load posts."
  ]);
}
