<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/util.php';

require_method('POST');

$name     = get_str($_POST, 'name', '');
$email    = get_str($_POST, 'email', '');
$subject  = get_str($_POST, 'subject', '');
$category = get_str($_POST, 'category', 'General');
$message  = get_str($_POST, 'message', '');

if ($name === '' || !validate_email($email) || $message === '') {
    json_response(false, null, 'Please provide name, valid email, and a message.', 422);
}

try {
    $pdo = db();
    $stmt = $pdo->prepare("
        INSERT INTO contact_messages (name, email, subject, category, message)
        VALUES (:name, :email, :subject, :category, :message)
    ");
    $stmt->execute([
        ':name'     => $name,
        ':email'    => $email,
        ':subject'  => $subject,
        ':category' => $category,
        ':message'  => $message,
    ]);

    json_response(true, ['id' => (int)$pdo->lastInsertId()]);
} catch (Throwable $e) {
    json_response(false, null, APP_DEBUG ? $e->getMessage() : 'Failed to submit message', 500);
}
