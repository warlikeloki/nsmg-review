<?php
declare(strict_types=1);

function nsmg_admin_secrets(): array {
  // Normalize DOCUMENT_ROOT (may be .../public_html or .../public_html/neilsmith.org)
  $docroot = isset($_SERVER['DOCUMENT_ROOT']) ? rtrim((string)$_SERVER['DOCUMENT_ROOT'], '/') : '';
  $candidates = [];

  // Prefer a HOME-like path if available
  $homeEnv = getenv('HOME');
  if ($homeEnv && is_string($homeEnv)) {
    $home = rtrim($homeEnv, '/');
    if ($home !== '') {
      $candidates[] = $home . '/private/admin_auth_config.php';
    }
  }

  // Derive cPanel "home" by stripping the /public_html suffix (and any subfolder after it)
  if ($docroot !== '') {
    $pos = strpos($docroot, '/public_html');
    if ($pos !== false) {
      $homeFromDocroot = substr($docroot, 0, $pos);              // e.g., /home4/USER
      if ($homeFromDocroot !== '') {
        $candidates[] = $homeFromDocroot . '/private/admin_auth_config.php';
      }
    }

    // Also try parent-of-docroot and grandparent-of-docroot, just in case
    $parent = rtrim(dirname($docroot), '/');                     // e.g., /home4/USER/public_html
    $grand  = rtrim(dirname($parent), '/');                      // e.g., /home4/USER
    if ($grand !== '') {
      $candidates[] = $grand . '/private/admin_auth_config.php';
    }
  }

  // Last-resort: allow a copy alongside this file (not recommended; gets wiped on deploy)
  $candidates[] = __DIR__ . '/admin_auth_config.php';

  foreach ($candidates as $cfg) {
    if (is_string($cfg) && $cfg !== '' && is_file($cfg)) {
      $data = require $cfg;
      return [
        'user'      => (string)($data['user'] ?? ''),
        'pass_hash' => (string)($data['pass_hash'] ?? ''),
      ];
    }
  }

  // Helpful error with the exact paths we tried
  header('Content-Type: text/plain; charset=utf-8', true, 500);
  echo "Admin authentication is not configured. Checked:\n";
  foreach ($candidates as $cfg) {
    echo " - $cfg\n";
  }
  exit;
}
