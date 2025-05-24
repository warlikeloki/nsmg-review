<?php
header("Content-Type: application/json");
require_once __DIR__ . '/db_connect.php';

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
    exit;
}

function sanitize($s) {
    return htmlspecialchars(strip_tags(trim($s)));
}

$site_title      = sanitize($_POST["site_title"] ?? '');
$meta_description= sanitize($_POST["meta_description"] ?? '');
$contact_email   = sanitize($_POST["contact_email"] ?? '');
$facebook_url    = sanitize($_POST["facebook_url"] ?? '');
$instagram_url   = sanitize($_POST["instagram_url"] ?? '');

if (empty($site_title) || empty($contact_email)) {
    echo json_encode(["success" => false, "message" => "Title and contact email are required."]);
    exit;
}

try {
    $pdo = new PDO($dsn, $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // Update the single settings row (assumes id=1)
    $stmt = $pdo->prepare("
      UPDATE website_settings
      SET site_title       = ?,
          meta_description = ?,
          contact_email    = ?,
          facebook_url     = ?,
          instagram_url    = ?,
          updated_at       = CURRENT_TIMESTAMP
      WHERE id = 1
    ");
    $stmt->execute([
        $site_title,
        $meta_description,
        $contact_email,
        $facebook_url,
        $instagram_url
    ]);

    echo json_encode(["success" => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error."]);
}
