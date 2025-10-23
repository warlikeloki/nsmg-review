<?php
// /php/mail_config.php
// Gmail (Google Workspace) SMTP configuration for Neil Smith Media Group.

// Load .env file if it exists
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
  $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
  foreach ($lines as $line) {
    // Skip comments
    if (strpos(trim($line), '#') === 0) {
      continue;
    }
    // Parse KEY=VALUE
    if (strpos($line, '=') !== false) {
      list($key, $value) = explode('=', $line, 2);
      $key = trim($key);
      $value = trim($value);
      // Only set if not already in environment
      if (!getenv($key)) {
        putenv("{$key}={$value}");
      }
    }
  }
}

function env_or($key, $default = null) {
  $v = getenv($key);
  return $v !== false && $v !== '' ? $v : $default;
}

// Define constants from environment variables
// Fallback values are ONLY used if .env is missing (for backward compatibility)
define('NSM_MAIL_HOST', env_or('NSM_MAIL_HOST', 'smtp.gmail.com'));
define('NSM_MAIL_PORT', intval(env_or('NSM_MAIL_PORT', '587')));
define('NSM_MAIL_SECURE', env_or('NSM_MAIL_SECURE', 'tls'));
define('NSM_MAIL_USER', env_or('NSM_MAIL_USER', 'neil@neilsmith.org'));
define('NSM_MAIL_PASS', env_or('NSM_MAIL_PASS', 'wdilwdcmwnvkoahi'));
define('NSM_MAIL_FROM', env_or('NSM_MAIL_FROM', 'contact@neilsmith.org'));
define('NSM_MAIL_FROMNAME', env_or('NSM_MAIL_FROMNAME', 'Neil Smith Media Group'));
define('NSM_MAIL_TO', env_or('NSM_MAIL_TO', 'owner@neilsmith.org'));
define('NSM_MAIL_BCC', env_or('NSM_MAIL_BCC', ''));
define('NSM_MAIL_REPLYTO', env_or('NSM_MAIL_REPLYTO', ''));
define('NSM_MAIL_LOG', env_or('NSM_MAIL_LOG', __DIR__ . '/../logs/mail.log'));
