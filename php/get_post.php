<?php
// /php/get_post.php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/util.php';

require_method('GET');

$slug = get_str($_GET, 'slug', '');
if ($slug === '') {
    json_response(false, null, 'Missing slug parameter.', 400);
}

try {
    $pdo = db();
    $stmt = $pdo->prepare("
        SELECT id, slug, title, content, author, tags, published_at, updated_at
        FROM blog_posts
        WHERE slug = :slug AND published_at IS NOT NULL
        LIMIT 1
    ");
    $stmt->execute([':slug' => $slug]);
    $post = $stmt->fetch();

    if (!$post) {
        json_response(false, null, 'Post not found', 404);
    }

    json_response(true, $post);
} catch (Throwable $e) {
    json_response(false, null, APP_DEBUG ? $e->getMessage() : 'Failed to load post', 500);
}
