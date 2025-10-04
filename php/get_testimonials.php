<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/../includes/db.php';   // must provide $pdo (PDO)
require_once __DIR__ . '/../includes/util.php'; // optional helpers

try {
    if (!isset($pdo) || !($pdo instanceof PDO)) {
        throw new Exception('Database connection not available.');
    }

    // Query params (safe defaults)
    $limit  = isset($_GET['limit'])  ? (int)$_GET['limit']  : 8;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
    $order  = isset($_GET['order'])  ? strtolower((string)$_GET['order']) : 'newest';

    $limit   = max(1, min($limit, 50)); // 1..50
    $offset  = max(0, $offset);
    $orderBy = ($order === 'oldest') ? 'created_at ASC' : 'created_at DESC';

    // Only approved testimonials go to public site
    $sql = "
        SELECT
            id,
            author,
            content AS quote,   -- alias to match front-end expectations
            rating,
            approved,
            created_at
        FROM testimonials
        WHERE approved = 1
        ORDER BY {$orderBy}
        LIMIT :limit OFFSET :offset
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':limit',  $limit,  PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data'    => $rows,
        'limit'   => $limit,
        'offset'  => $offset,
        'order'   => $order,
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
    ]);
}
