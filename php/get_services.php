<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

// Include DB connection
require_once __DIR__ . '/db_connect.php'; // Adjust path if needed

// Limit parameter with safety check
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 6;
if ($limit < 1 || $limit > 20) $limit = 6;

try {
    // Only select services where active = 1
    $stmt = $pdo->prepare("SELECT id, name, description FROM services WHERE active = 1 LIMIT ?");
    $stmt->bindValue(1, $limit, PDO::PARAM_INT);
    $stmt->execute();
    $services = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $services
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
    exit;
}
?>
