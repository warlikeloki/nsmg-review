<?php
declare(strict_types=1);

function nsmg_admin_secrets(): array {
  $cfg = __DIR__ . '/admin_auth_config.php';
  if (!is_file($cfg)) {
    http_response_code(500);
    echo 'Admin authentication is not configured. Missing admin_auth_config.php';
    exit;
  }
  $data = require $cfg;
  return [
    'user' => (string)($data['user'] ?? ''),
    'pass_hash' => (string)($data['pass_hash'] ?? '')
  ];
}
