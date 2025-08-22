<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/util.php';

require_method('POST');

$name     = get_str($_POST, 'name', '');
$email    = get_str($_POST, 'email', '');
$phone    = get_str($_POST, 'phone', '');
$date     = get_str($_POST, 'date', '');
$location = get_str($_POST, 'location', '');
$duration = get_str($_POST, 'duration', '');
$details  = get_str($_POST, 'details', '');

$services = $_POST['services'] ?? [];
if (!is_array($services)) $services = [];

$services = array_values(array_filter(array_map(function($v){
    return trim((string)$v);
}, $services)));

if ($name === '' || !validate_email($email) || empty($services) || $details === '') {
    json_response(false, null, 'Please provide name, valid email, at least one service, and details.', 422);
}

try {
    $pdo = db();
    $stmt = $pdo->prepare("
        INSERT INTO service_requests
            (name, email, phone, services, preferred_date, location, duration, details)
        VALUES
            (:name, :email, :phone, :services, :preferred_date, :location, :duration, :details)
    ");
    $stmt->execute([
        ':name'          => $name,
        ':email'         => $email,
        ':phone'         => $phone,
        ':services'      => json_encode($services, JSON_UNESCAPED_UNICODE),
        ':preferred_date'=> $date ?: null,
        ':location'      => $location ?: null,
        ':duration'      => $duration ?: null,
        ':details'       => $details
    ]);
    json_response(true, ['id' => (int)$pdo->lastInsertId()]);
} catch (Throwable $e) {
    json_response(false, null, APP_DEBUG ? $e->getMessage() : 'Failed to submit service request', 500);
}
