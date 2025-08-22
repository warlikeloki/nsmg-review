<?php
header("Content-Type: application/json");
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/util.php';

try {
    $pdo = new PDO($dsn, $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    $stmt = $pdo->query("
        SELECT 
            id,
            invoice_number,
            client_name,
            client_email,
            amount,
            status,
            due_date,
            notes,
            created_at,
            updated_at
        FROM invoices
        ORDER BY created_at DESC
    ");

    $invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "data"    => $invoices
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Server error while retrieving invoices."
    ]);
}
