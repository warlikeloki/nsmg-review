<?php
// /tools/send_test_email.php
// Simple PHPMailer test for Neil Smith Media Group
// Delete or restrict after confirming email delivery.

header('Content-Type: text/plain; charset=UTF-8');

require __DIR__ . '/../php/mail_config.php';

// Load PHPMailer (Composer autoload or manual)
$hasComposer = file_exists(__DIR__ . '/../vendor/autoload.php');
if ($hasComposer) {
  require __DIR__ . '/../vendor/autoload.php';
} else {
  require __DIR__ . '/../php/PHPMailer/src/PHPMailer.php';
  require __DIR__ . '/../php/PHPMailer/src/SMTP.php';
  require __DIR__ . '/../php/PHPMailer/src/Exception.php';
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

try {
  $mail = new PHPMailer(true);
  $mail->isSMTP();
  $mail->Host       = NSM_MAIL_HOST;      // e.g., smtp.gmail.com
  $mail->Port       = NSM_MAIL_PORT;      // 587
  $mail->SMTPAuth   = true;
  $mail->Username   = NSM_MAIL_USER;
  $mail->Password   = NSM_MAIL_PASS;
  $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;

  $mail->setFrom(NSM_MAIL_FROM, NSM_MAIL_FROMNAME);
  $mail->addAddress(NSM_MAIL_TO);
  $mail->Subject = 'NSMG SMTP Smoke Test';
  $mail->Body    = "If you received this, SMTP is working.\nTime: " . date('c');

  $mail->send();
  echo "OK: Sent to " . NSM_MAIL_TO . "\n";
} catch (Exception $e) {
  http_response_code(500);
  echo "FAIL: " . $e->getMessage() . "\n";
}
