<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/util.php';

require_method('GET');

$page     = max(1, get_int($_GET, 'page', 1));
$perPage  = min(50, max(1, get_int($_GET, 'per_page', 10)));
$offset   = ($page - 1) * $perPage;

$sql = "SELECT SQL_CALC_FOUND_ROWS id, slug, title, content, author, published_at
        FROM blog_posts
        WHERE published_at IS NOT NULL
        ORDER BY published_at DESC
        LIMIT :limit OFFSET :offset";

try {
    $pdo = db();
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':limit',  $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset,  PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll();

    // Build teasers safely
    $items = [];
    foreach ($rows as $r) {
        $plain = trim(preg_replace('/\s+/', ' ', strip_tags($r['content'] ?? '')));
        $teaser = mb_substr($plain, 0, 220) . (mb_strlen($plain) > 220 ? '…' : '');
        $items[] = [
            'id'           => (int)$r['id'],
            'slug'         => $r['slug'],
            'title'        => $r['title'],
            'author'       => $r['author'],
            'published_at' => $r['published_at'],
            'teaser'       => $teaser
        ];
    }

    $total = (int)$pdo->query("SELECT FOUND_ROWS() AS n")->fetch()['n'];

    json_response(true, [
        'items'     => $items,
        'page'      => $page,
        'per_page'  => $perPage,
        'total'     => $total,
        'pages'     => (int)ceil($total / $perPage)
    ]);
} catch (Throwable $e) {
    json_response(false, null, APP_DEBUG ? $e->getMessage() : 'Failed to load blog posts', 500);
}
