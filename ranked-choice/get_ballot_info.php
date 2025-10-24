<?php
header("Content-Type: application/json");

require_once __DIR__ . '/../includes/db.php';

// Validate input
$ballot_id = isset($_GET['ballot']) ? (int)$_GET['ballot'] : 0;
if ($ballot_id <= 0) {
    echo json_encode(["success" => false, "message" => "Invalid ballot ID."]);
    exit;
}

try {
    $pdo = new PDO($dsn, $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // Check expiration and retrieve ballot
    $stmt = $pdo->prepare("SELECT title, description, candidates, expires_at FROM ranked_ballots WHERE id = ? LIMIT 1");
    $stmt->execute([$ballot_id]);
    $ballot = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$ballot) {
        echo json_encode(["success" => false, "message" => "Ballot not found."]);
        exit;
    }

    // Check if expired
    if (strtotime($ballot['expires_at']) < time()) {
        echo json_encode(["success" => false, "message" => "This ballot has expired."]);
        exit;
    }

    echo json_encode([
        "success" => true,
        "title" => $ballot['title'],
        "description" => $ballot['description'],
        "candidates" => json_decode($ballot['candidates'])
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error."]);
}
?>
