<?php
header("Content-Type: application/json");

// Only accept POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
    exit;
}

function sanitize($v) {
    return htmlspecialchars(strip_tags(trim($v)));
}

// Retrieve & sanitize
$name     = sanitize($_POST['name'] ?? '');
$email    = sanitize($_POST['email'] ?? '');
$phone    = sanitize($_POST['phone'] ?? '');
$date     = sanitize($_POST['date'] ?? '');
$location = sanitize($_POST['location'] ?? '');
$duration = sanitize($_POST['duration'] ?? '');
$details  = sanitize($_POST['details'] ?? '');

// Handle services[] array
$services_raw = $_POST['services'] ?? [];
$services = [];
foreach ($services_raw as $svc) {
    $services[] = sanitize($svc);
}

if (empty($name) || empty($email) || empty($services) || empty($details)) {
    echo json_encode(["success" => false, "message" => "Please fill in all required fields."]);
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["success" => false, "message" => "Invalid email address."]);
    exit;
}

// Simulate storing $services as JSON, etc.
// e.g., $services_json = json_encode($services);

echo json_encode([
    "success" => true,
    "message" => "Service request submitted successfully."
]);
exit;
?>
