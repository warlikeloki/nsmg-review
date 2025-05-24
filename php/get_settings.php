<?php
header("Content-Type: application/json");
require_once __DIR__ . '/db_connect.php';

try {
    $pdo = new PDO($dsn, $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // We keep just one row; grab the latest
    $stmt = $pdo->query("
      SELECT site_title, meta_description, contact_email, facebook_url, instagram_url
      FROM website_settings
      ORDER BY id DESC
      LIMIT 1
    ");
    $settings = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$settings) {
        throw new Exception("Settings not found.");
    }

    echo json_encode(["success" => true, "data" => $settings]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
