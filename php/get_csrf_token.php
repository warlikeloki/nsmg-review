<?php
// /php/get_csrf_token.php
// Provides CSRF token for forms

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, max-age=0');

require __DIR__ . '/security.php';

// Generate/retrieve CSRF token
$token = CSRFProtection::getToken();

echo json_encode([
  'ok' => true,
  'token' => $token
], JSON_UNESCAPED_SLASHES);
