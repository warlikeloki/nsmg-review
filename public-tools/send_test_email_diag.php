<?php
// /tools/send_test_email_diag.php
// Verbose diagnostics to find 500s before sending mail.
// Delete or restrict after use.

header('Content-Type: text/plain; charset=UTF-8');
ini_set('display_errors', '1');
error_reporting(E_ALL);

echo "== NSMG SMTP Diagnostic ==\n";

// 1) PHP version
echo "PHP: " . PHP_VERSION . "\n";

// 2) Load config
$cfgPath = __DIR__ . '/../php/mail_config.php';
echo "Config path: $cfgPath\n";
if (!file_exists($cfgPath)) {
  http_response_code(500);
  exit("ERROR: mail_config.php not found at $cfgPath\n");
}
include_once $cfgPath;
echo "Loaded mail_config.php\n";

// 3) Decide loader: Composer or manual
$autoloadPath = __DIR__ . '/../vendor/autoload.php';
$useComposer = file_exists($autoloadPath);
echo "Composer autoload: " . ($useComposer ? "FOUND" : "NOT FOUND") . " ($autoloadPath)\n";

// 4) Load PHPMailer classes
if ($useComposer) {
  include_once $autoloadPath;
  echo "Included vendor/autoload.php\n";
} else {
  $base = __DIR__ . '/../php/PHPMailer/src';
  $pPHPMailer = $base . '/PHPMailer.php';
  $pSMTP      = $base . '/SMTP.php';
  $pExcept    = $base . '/Exception.php';

  echo "Manual PHPMailer src dir: $base\n";
  echo " - PHPMailer.php: " . (file_exists($pPHPMailer) ? "FOUND" : "MISSING") . "\n";
  echo " - SMTP.php: "      . (file_exists($pSMTP)      ? "FOUND" : "MISSING") . "\n";
  echo " - Exception.php: " . (file_exists($pExcept)    ? "FOUND" : "MISSING") . "\n";

  // use include_once (not require) so we can fail gracefully
  $ok1 = @include_once $pExcept;
  $ok2 = @include_once $pPHPMailer;
  $ok3 = @include_once $pSMTP;

  if (!$ok1 || !$ok2 || !$ok3) {
    http_response_code(500);
    exit("ERROR: One or more PHPMailer class files could not be included. Fix paths/case.\n");
  }
  echo "Included manual PHPMailer classes\n";
}

// 5) Show non-secret config sanity (mask password)
$host = defined('NSM_MAIL_HOST') ? NSM_MAIL_HOST : '(undef)';
$port = defined('NSM_MAIL_PORT') ? NSM_MAIL_PORT : '(undef)';
$user = defined('NSM_MAIL_USER') ? NSM_MAIL_USER : '(undef)';
$passMask = (defined('NSM_MAIL_PASS') && NSM_MAIL_PASS) ? (strlen(NSM_MAIL_PASS) . " chars") : '(empty)';
$from = defined('NSM_MAIL_FROM') ? NSM_MAIL_FROM : '(undef)';
$to   = defined('NSM_MAIL_TO')   ? NSM_MAIL_TO   : '(undef)';

echo "Config summary:\n";
echo " - Host: $host\n";
echo " - Port: $port\n";
echo " - User: $user\n";
echo " - Pass: $passMask\n";
echo " - From: $from\n";
echo " - To:   $to\n";

// 6) Attempt send
echo "Attempting SMTP send...\n";

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

try {
  $m = new PHPMailer(true);
  $m->isSMTP();
  $m->Host       = NSM_MAIL_HOST ?? 'smtp.gmail.com';
  $m->Port       = NSM_MAIL_PORT ?? 587;
  $m->SMTPAuth   = true;
  $m->Username   = NSM_MAIL_USER ?? '';
  $m->Password   = NSM_MAIL_PASS ?? '';
  $m->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;

  $m->setFrom(NSM_MAIL_FROM ?? $user, NSM_MAIL_FROMNAME ?? 'Website');
  $m->addAddress(NSM_MAIL_TO ?? $user);
  $m->Subject = 'NSMG SMTP Diagnostic';
  $m->Body    = "If you received this, SMTP is working.\nTime: " . date('c');

  $m->send();
  echo "OK: Sent to " . (NSM_MAIL_TO ?? $user) . "\n";
} catch (Exception $e) {
  http_response_code(500);
  echo "FAIL: " . $e->getMessage() . "\n";
}
