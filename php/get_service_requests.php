<?php
header("Content-Type: application/json");
require_once __DIR__ . '/db_connect.php';

try {
    $pdo = new PDO($dsn, $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    $stmt = $pdo->query("
        SELECT id, name, email, phone, services, preferred_date, location, duration, details, submitted_at
        FROM service_requests
        ORDER BY submitted_at DESC
    ");
    $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Decode JSON services for each request
    foreach ($requests as &$req) {
        $req['services'] = json_decode($req['services'], true);
    }

    echo json_encode(["success" => true, "data" => $requests]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error."]);
}
