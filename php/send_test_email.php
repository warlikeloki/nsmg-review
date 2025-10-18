<?php
// /php/send_test_email.php
// Purpose: One-off SMTP smoke test for Google Workspace via PHPMailer.
// Delete or protect (deny from web) after testing.

header('Content-Type: text/plain; charset=UTF-8');

require __DIR__ . '/mail_config.php';

$hasComposer = file_exists(__DIR__ . '/../vendor/autoload.php');
if ($hasComposer) {
  require __DIR__ . '/../vendor/autoload.php';
} else {
  // Manual include path if you vendored PHPMailer under /php/PHPMailer/
  require __DIR__ . '/PHPMailer/src/PHPMailer.php';
  require __DIR__ . '/PHPMailer/src/SMTP.php';
  require __DIR__ . '/PHPMailer/src/Exception.php';
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

try {
  $m = new PHPMailer(true);
  $m->isSMTP();
  $m->Host       = NSM_MAIL_HOST;          // e.g., smtp.gmail.com
  $m->Port       = NSM_MAIL_PORT;          // 587
  $m->SMTPAuth   = true;
  $m->Username   = NSM_MAIL_USER;          // your Workspace address
  $m->Password   = NSM_MAIL_PASS;          // 16-char App Password
  // STARTTLS for Gmail
  $m->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;

  $m->setFrom(NSM_MAIL_FROM, NSM_MAIL_FROMNAME);
  $m->addAddress(NSM_MAIL_TO);             // where to send the test
  $m->Subject = 'NSMG SMTP Smoke Test';
  $body = "If you received this, SMTP is working.\nTime: " . date('c');
  $m->isHTML(true);
  $m->Body    = nl2br(htmlentities($body, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'));
  $m->AltBody = $body;

  $m->send();

  // Optional: simple file log if configured
  if (defined('NSM_MAIL_LOG') && NSM_MAIL_LOG) {
    @file_put_contents(NSM_MAIL_LOG, "[".date('c')."] OK test -> ".NSM_MAIL_TO.PHP_EOL, FILE_APPEND);
  }

  echo "OK: Sent to ".NSM_MAIL_TO."\n";
} catch (Exception $e) {
  if (defined('NSM_MAIL_LOG') && NSM_MAIL_LOG) {
    @file_put_contents(NSM_MAIL_LOG, "[".date('c')."] FAIL test :: ".$e->getMessage().PHP_EOL, FILE_APPEND);
  }
  http_response_code(500);
  echo "FAIL: ".$e->getMessage()."\n";
}
