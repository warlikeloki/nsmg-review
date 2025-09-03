<?php
// /php/submit_contact.php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/util.php';

nsmg_nocache();
require_method('POST');

// Helpers
function sanitize_phone_optional(?string $s): ?string {
    if ($s === null) return null;
    $s = trim($s);
    if ($s === '') return null;
    // Allow digits, spaces, hyphens, parentheses, and a single leading '+'
    // Remove any '+' not at the beginning
    $s = preg_replace('/(?!^)\+/', '', $s);
    // Strip any character not allowed
    $s = preg_replace('/[^0-9\-\s\(\)\+]/', '', $s);
    return $s === '' ? null : $s;
}

// Read inputs (accept legacy 'topic' alias for 'category')
$name     = get_str($_POST, 'name', '');
$email    = get_str($_POST, 'email', '');
$category = get_str($_POST, 'category', '');
if ($category === '' && isset($_POST['topic'])) {
    $category = get_str($_POST, 'topic', '');
}
$subject  = get_str($_POST, 'subject', '');
$message  = get_str($_POST, 'message', '');
$phone    = isset($_POST['phone']) ? get_str($_POST, 'phone', '') : '';

// Basic validation
if ($name === '' || !validate_email($email) || $message === '') {
    json_response(false, null, 'Please provide name, a valid email, and a message.', 422);
}

try {
    $pdo = db();

    // Default subject if not provided
    $subject = $subject !== '' ? $subject : sprintf('Website Contact (%s)', $category !== '' ? $category : 'General');

    // Sanitize phone (optional)
    $phone = sanitize_phone_optional($phone);

    $stmt = $pdo->prepare("
        INSERT INTO contact_messages (name, email, subject, category, phone, message)
        VALUES (:name, :email, :subject, :category, :phone, :message)
    ");
    $stmt->execute([
        ':name'     => $name,
        ':email'    => $email,
        ':subject'  => $subject,
        ':category' => $category !== '' ? $category : null,
        ':phone'    => $phone, // null if not provided
        ':message'  => $message,
    ]);

    json_response(true, ['id' => (int)$pdo->lastInsertId()]);
} catch (Throwable $e) {
    json_response(false, null, APP_DEBUG ? $e->getMessage() : 'Failed to submit message', 500);
}
