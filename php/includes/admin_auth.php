<?php
declare(strict_types=1);

function nsmg_admin_secrets(): array {
  $docroot = isset($_SERVER['DOCUMENT_ROOT']) ? rtrim($_SERVER['DOCUMENT_ROOT'], '/') : '';
  $home = $docroot ? dirname($docroot) : null;

  // Preferred: outside web root (survives deploys). Fallback: inside includes/
  $candidates = [];
  if ($home) {
    $candidates[] = $home . '/private/admin_auth_config.php';
  }
  $candidates[] = __DIR__ . '/admin_auth_config.php';

  foreach ($candidates as $cfg) {
    if ($cfg && is_file($cfg)) {
      $data = require $cfg;
      return [
        'user' => (string)($data['user'] ?? ''),
        'pass_hash' => (string)($data['pass_hash'] ?? ''),
      ];
    }
  }

  http_response_code(500);
  header('Content-Type: text/plain; charset=utf-8');
  echo "Admin authentication is not configured. Provide admin_auth_config.php at:\n";
  if ($home) {
    echo " - {$home}/private/admin_auth_config.php\n";
  }
  echo ' - ' . (__DIR__ . '/admin_auth_config.php') . "\n";
  exit;
}
