<?php
header("Content-Type: application/json");

// Only allow POST requests
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
    exit;
}

// DB connection (replace with your own credentials)
require_once __DIR__ . '/../php/db_connect.php'; // assumes you have a separate db_connect.php file

function sanitize($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

// Gather and sanitize inputs
$title = sanitize($_POST["title"] ?? '');
$description = sanitize($_POST["description"] ?? '');
$expires_at = sanitize($_POST["expires_at"] ?? '');
$candidates = $_POST["candidates"] ?? [];

if (empty($title) || empty($expires_at) || count($candidates) < 2) {
    echo json_encode(["success" => false, "message" => "Missing required fields."]);
    exit;
}

// Ensure candidates are cleaned
$clean_candidates = array_filter(array_map('sanitize', $candidates));
if (count($clean_candidates) < 2) {
    echo json_encode(["success" => false, "message" => "At least two candidates required."]);
    exit;
}

try {
    $pdo = new PDO($dsn, $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    $stmt = $pdo->prepare("INSERT INTO ranked_ballots (title, description, candidates, expires_at) VALUES (?, ?, ?, ?)");
    $stmt->execute([
        $title,
        $description,
        json_encode(array_values($clean_candidates)),
        $expires_at
    ]);

    $ballot_id = $pdo->lastInsertId();

    echo json_encode(["success" => true, "ballot_id" => $ballot_id]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error."]);
}
?>
