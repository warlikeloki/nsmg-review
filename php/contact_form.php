<?php
header("Content-Type: application/json");

// Only accept POST requests
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
    exit;
}

// Helper function to sanitize input
function sanitize($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

// Retrieve and sanitize input fields
$name = sanitize($_POST["name"] ?? '');
$email = sanitize($_POST["email"] ?? '');
$topic = sanitize($_POST["topic"] ?? '');
$message = sanitize($_POST["message"] ?? '');

// Basic validation
if (empty($name) || empty($email) || empty($topic) || empty($message)) {
    echo json_encode(["success" => false, "message" => "All fields are required."]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["success" => false, "message" => "Invalid email address."]);
    exit;
}

// Simulate successful submission
$response = [
    "success" => true,
    "message" => "Form submitted successfully."
];

echo json_encode($response);
exit;
?>
