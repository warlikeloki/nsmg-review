<?php
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
    exit;
}

function sanitize($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

// Retrieve and sanitize input
$name     = sanitize($_POST["name"] ?? '');
$email    = sanitize($_POST["email"] ?? '');
$phone    = sanitize($_POST["phone"] ?? '');
$service  = sanitize($_POST["service"] ?? '');
$date     = sanitize($_POST["date"] ?? '');
$details  = sanitize($_POST["details"] ?? '');

// Basic validation
if (empty($name) || empty($email) || empty($service) || empty($details)) {
    echo json_encode(["success" => false, "message" => "Please fill in all required fields."]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["success" => false, "message" => "Invalid email address."]);
    exit;
}

// Simulated success response
$response = [
    "success" => true,
    "message" => "Service request submitted successfully."
];

echo json_encode($response);
exit;
?>
