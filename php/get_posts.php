<?php
// /php/get_posts.php
// JSON-backed blog API (no SQL). Supports:
//   - ?id=post-001            -> returns single post (object)
//   - ?slug=my-first-post     -> returns single post (object)
//   - ?limit=1 (or 20, etc.)  -> returns newest N posts (array)
// If no params: returns all posts (array).
//
// Later, you can replace the "loadFromJson()" with a SQL loader and keep the same response shape.

declare(strict_types=1);

// -------- Config --------
$JSON_PATH = __DIR__ . '/../json/posts.json'; // adjust if needed

// -------- Helpers --------
function send_json($data, int $status = 200): void {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
  exit;
}

function loadFromJson(string $path): array {
  if (!is_file($path)) {
    send_json(['error' => 'posts.json not found', 'path' => $path], 404);
  }
  $raw = file_get_contents($path);
  if ($raw === false) {
    send_json(['error' => 'Unable to read posts.json'], 500);
  }
  $data = json_decode($raw, true);
  if (!is_array($data)) {
    send_json(['error' => 'Invalid JSON structure in posts.json'], 500);
  }
  // Allow either an array of posts OR { "posts": [...] }
  $posts = $data;
  if (isset($data['posts']) && is_array($data['posts'])) {
    $posts = $data['posts'];
  }
  // Normalize: ensure array of associative arrays
  $posts = array_values(array_filter($posts, 'is_array'));

  // Sort newest-first if date present
  usort($posts, function($a, $b) {
    $ad = isset($a['date']) ? strtotime((string)$a['date']) : 0;
    $bd = isset($b['date']) ? strtotime((string)$b['date']) : 0;
    return $bd <=> $ad;
  });

  return $posts;
}

function findById(array $posts, string $id): ?array {
  foreach ($posts as $p) {
    if (isset($p['id']) && (string)$p['id'] === $id) return $p;
  }
  return null;
}

function findBySlug(array $posts, string $slug): ?array {
  foreach ($posts as $p) {
    if (isset($p['slug']) && (string)$p['slug'] === $slug) return $p;
  }
  return null;
}

// -------- Main --------
$posts = loadFromJson($JSON_PATH);

// Parse params
$id   = isset($_GET['id'])   ? trim((string)$_GET['id'])   : '';
$slug = isset($_GET['slug']) ? trim((string)$_GET['slug']) : '';
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 0;

// Single by id or slug
if ($id !== '') {
  $post = findById($posts, $id);
  if (!$post) send_json(['error' => 'Post not found', 'id' => $id], 404);
  send_json($post, 200);
}
if ($slug !== '') {
  $post = findBySlug($posts, $slug);
  if (!$post) send_json(['error' => 'Post not found', 'slug' => $slug], 404);
  send_json($post, 200);
}

// List (optionally limited)
if ($limit > 0) {
  send_json(array_slice($posts, 0, $limit), 200);
}

// All
send_json($posts, 200);
