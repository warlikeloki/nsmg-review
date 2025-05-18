<?php
header("Content-Type: application/json");

require_once __DIR__ . '/../php/db_connect.php';

// Validate request method
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
    exit;
}

// Read and decode JSON body
$data = json_decode(file_get_contents("php://input"), true);
$ballot_id = isset($data['ballot_id']) ? (int)$data['ballot_id'] : 0;
$rankings = isset($data['rankings']) ? $data['rankings'] : [];

if ($ballot_id <= 0 || !is_array($rankings) || count($rankings) < 2) {
    echo json_encode(["success" => false, "message" => "Invalid data."]);
    exit;
}

try {
    $pdo = new PDO($dsn, $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // Optional: verify the ballot still exists and hasn't expired
    $stmt = $pdo->prepare("SELECT expires_at FROM ranked_ballots WHERE id = ?");
    $stmt->execute([$ballot_id]);
    $ballot = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$ballot || strtotime($ballot['expires_at']) < time()) {
        echo json_encode(["success" => false, "message" => "Ballot not found or expired."]);
        exit;
    }

    // Insert vote
    $stmt = $pdo->prepare("INSERT INTO ranked_votes (ballot_id, rankings) VALUES (?, ?)");
    $stmt->execute([
        $ballot_id,
        json_encode(array_values($rankings))
    ]);

    echo json_encode(["success" => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error."]);
}
?>
