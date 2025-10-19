<?php
// /php/submit_contact.php
// Receives POST from /contact_form.php and emails details via PHPMailer + Gmail SMTP.

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, max-age=0');

require __DIR__ . '/mail_config.php';

// Load PHPMailer (Composer autoload if present; else manual)
$hasComposer = file_exists(__DIR__ . '/../vendor/autoload.php');
if ($hasComposer) {
  require __DIR__ . '/../vendor/autoload.php';
} else {
  require __DIR__ . '/PHPMailer/src/PHPMailer.php';
  require __DIR__ . '/PHPMailer/src/SMTP.php';
  require __DIR__ . '/PHPMailer/src/Exception.php';
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

function json_fail($message, $code = 400, $data = []) {
  http_response_code($code);
  echo json_encode(['ok' => false, 'error' => $message, 'data' => $data], JSON_UNESCAPED_SLASHES);
  exit;
}
function json_ok($message, $data = []) {
  echo json_encode(['ok' => true, 'message' => $message, 'data' => $data], JSON_UNESCAPED_SLASHES);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  json_fail('Invalid method', 405);
}

// Gather inputs
$name    = trim($_POST['name'] ?? '');
$email   = trim($_POST['email'] ?? '');
$phone   = trim($_POST['phone'] ?? '');
$about   = trim($_POST['about'] ?? 'General');
$message = trim($_POST['message'] ?? '');
$hp      = trim($_POST['website'] ?? ''); // honeypot

if ($hp !== '') {
  // Bot: pretend OK
  json_ok('Thanks!');
}

if ($name === '' || $email === '' || $message === '') {
  json_fail('Required fields missing: name, email, message.');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  json_fail('Please enter a valid email address.');
}

// Compose email
$ip   = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$ua   = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
$time = date('c');

$subject = "New Website Contact — {$about}";
$bodyHtml = <<<HTML
<h2>New Contact Submission</h2>
<p><strong>Name:</strong> {$name}</p>
<p><strong>Email:</strong> {$email}</p>
<p><strong>Phone:</strong> {$phone}</p>
<p><strong>About:</strong> {$about}</p>
<p><strong>Message:</strong><br/>nl2br</p>
<hr>
<p style="font-size:12px;color:#666">Meta: {$time} • IP {$ip} • {$ua}</p>
HTML;

$bodyHtml = str_replace('nl2br', nl2br(htmlentities($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')), $bodyHtml);

$bodyText = "New Contact Submission\n\n"
          . "Name: {$name}\n"
          . "Email: {$email}\n"
          . "Phone: {$phone}\n"
          . "About: {$about}\n\n"
          . "Message:\n{$message}\n\n"
          . "Meta: {$time} • IP {$ip}";

// Send via Gmail SMTP
try {
  $mail = new PHPMailer(true);
  $mail->isSMTP();
  $mail->Host       = NSM_MAIL_HOST;
  $mail->Port       = NSM_MAIL_PORT;
  $mail->SMTPAuth   = true;
  $mail->AuthType   = 'LOGIN'; // helps on some hosts
  $mail->Username   = NSM_MAIL_USER; // e.g., neil@neilsmith.org
  $mail->Password   = NSM_MAIL_PASS; // 16-char App Password
  if (NSM_MAIL_SECURE === 'ssl' || NSM_MAIL_SECURE === 'tls') {
    $mail->SMTPSecure = NSM_MAIL_SECURE;
  } else {
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
  }

  // From/To
  $mail->setFrom(NSM_MAIL_FROM, NSM_MAIL_FROMNAME); // e.g., contact@neilsmith.org (alias of neil@)
  $mail->addAddress(NSM_MAIL_TO);                   // destination, e.g., owner@

  // Optional BCC list
  if (defined('NSM_MAIL_BCC') && NSM_MAIL_BCC) {
    foreach (explode(',', NSM_MAIL_BCC) as $bcc) {
      $bcc = trim($bcc);
      if ($bcc !== '') $mail->addBCC($bcc);
    }
  }

  // Let you reply directly to the user
  $mail->addReplyTo($email, $name);

  $mail->Subject = $subject;
  $mail->isHTML(true);
  $mail->Body    = $bodyHtml;
  $mail->AltBody = $bodyText;

  $mail->send();

  // Optional logging
  if (defined('NSM_MAIL_LOG') && NSM_MAIL_LOG) {
    @file_put_contents(NSM_MAIL_LOG, "[".date('c')."] OK contact {$email} -> ".NSM_MAIL_TO.PHP_EOL, FILE_APPEND);
  }

  json_ok('Thanks! Your message has been sent.');
} catch (Exception $e) {
  // Log and return a graceful fallback
  if (defined('NSM_MAIL_LOG') && NSM_MAIL_LOG) {
    @file_put_contents(NSM_MAIL_LOG, "[".date('c')."] FAIL contact {$email} :: ".$e->getMessage().PHP_EOL, FILE_APPEND);
  }

  $fallback = [
    'mailto' => 'mailto:' . rawurlencode(NSM_MAIL_TO)
                . '?subject=' . rawurlencode('Website Contact — ' . $about)
                . '&body=' . rawurlencode("Name: {$name}\nEmail: {$email}\nPhone: {$phone}\n\n{$message}\n"),
  ];
  json_fail('Delivery failed. Use the email link to contact us directly.', 502, $fallback);
}
