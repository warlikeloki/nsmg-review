<?php
header("Content-Type: application/json");
require_once __DIR__ . '/db_connect.php';

try {
    $pdo = new PDO($dsn, $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    $stmt = $pdo->query("
      SELECT
        id,
        entry_date,
        type,
        category,
        amount,
        description,
        reference,
        created_at,
        updated_at
      FROM accounting_entries
      ORDER BY entry_date DESC, id DESC
    ");

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
      "success" => true,
      "data"    => $rows
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
      "success" => false,
      "message" => "Server error."
    ]);
}
