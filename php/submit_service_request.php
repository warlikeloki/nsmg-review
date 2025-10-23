<?php
// /php/submit_service_request.php
// Receives POST from service_request.php and emails details using PHPMailer + Gmail SMTP.

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, max-age=0');

require __DIR__ . '/mail_config.php';
require __DIR__ . '/security.php';

// Set security headers
SecurityHeaders::setHeaders();

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

// CSRF Protection
if (!CSRFProtection::validateRequest()) {
  json_fail('Invalid or expired security token. Please refresh the page and try again.', 403);
}

// Rate Limiting (3 submissions per 5 minutes per session)
$rateLimit = new RateLimit('service_request', 3, 300);
$rateLimitCheck = $rateLimit->check();

if (!$rateLimitCheck['allowed']) {
  $retryAfter = RateLimit::formatRetryAfter($rateLimitCheck['retry_after']);
  json_fail("Too many submissions. Please try again in {$retryAfter}.", 429);
}

// Gather and sanitize inputs
$name     = InputSanitizer::sanitizeText($_POST['name'] ?? '', 100);
$email    = InputSanitizer::sanitizeEmail($_POST['email'] ?? '');
$phone    = InputSanitizer::sanitizePhone($_POST['phone'] ?? '');
$services = $_POST['services'] ?? []; // array
if (!is_array($services)) $services = [];
$services = array_map(function($s) { return InputSanitizer::sanitizeText($s, 50); }, $services);
$service_location = InputSanitizer::sanitizeText($_POST['service_location'] ?? '', 200);
$duration        = InputSanitizer::sanitizeText($_POST['duration'] ?? '', 50);
$target_date     = InputSanitizer::sanitizeText($_POST['target_date'] ?? '', 50);
$message         = InputSanitizer::sanitizeText($_POST['message'] ?? '', 5000);
$hp              = trim($_POST['website'] ?? ''); // honeypot

// Honeypot check
if ($hp !== '') {
  // Bot: pretend OK but don't record attempt
  json_ok('Thanks!');
}

// Required field validation
if ($name === '' || $email === '' || $message === '') {
  json_fail('Required fields missing: name, email, message.');
}

// Email validation
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  json_fail('Please enter a valid email address.');
}

// Spam detection
if (InputSanitizer::isSpammy($message) || InputSanitizer::isSpammy($name)) {
  // Log as potential spam but pretend success
  if (defined('NSM_MAIL_LOG') && NSM_MAIL_LOG) {
    @file_put_contents(NSM_MAIL_LOG, "[".date('c')."] SPAM DETECTED (service) from {$email} (IP: ".$_SERVER['REMOTE_ADDR'].")\n", FILE_APPEND);
  }
  json_ok('Thanks!');
}

// Malicious input detection
if (InputSanitizer::isSuspicious($message) || InputSanitizer::isSuspicious($name)) {
  json_fail('Invalid input detected. Please remove any code or scripts from your message.');
}

// Record rate limit attempt
$rateLimit->recordAttempt();

$services_list = array_map('trim', $services);
$services_str  = implode(', ', $services_list);

// Compose email
$ip   = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$ua   = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
$time = date('c');

$subject = 'New Service Request';
$bodyHtml = <<<HTML
<h2>New Service Request</h2>
<p><strong>Name:</strong> {$name}</p>
<p><strong>Email:</strong> {$email}</p>
<p><strong>Phone:</strong> {$phone}</p>
<p><strong>Services:</strong> {$services_str}</p>
<p><strong>Service Location:</strong> {$service_location}</p>
<p><strong>Estimated Duration:</strong> {$duration}</p>
<p><strong>Target Date:</strong> {$target_date}</p>
<p><strong>Details:</strong><br/>nl2br</p>
<hr>
<p style="font-size:12px;color:#666">Meta: {$time} • IP {$ip} • {$ua}</p>
HTML;

$bodyHtml = str_replace('nl2br', nl2br(htmlentities($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')), $bodyHtml);

$bodyText =
"New Service Request\n\n".
"Name: {$name}\n".
"Email: {$email}\n".
"Phone: {$phone}\n".
"Services: {$services_str}\n".
"Service Location: {$service_location}\n".
"Estimated Duration: {$duration}\n".
"Target Date: {$target_date}\n\n".
"Details:\n{$message}\n\n".
"Meta: {$time} • IP {$ip}";

// Send via Gmail SMTP
try {
  $mail = new PHPMailer(true);
  $mail->isSMTP();
  $mail->Host       = NSM_MAIL_HOST;
  $mail->Port       = NSM_MAIL_PORT;
  $mail->SMTPAuth   = true;
  $mail->AuthType   = 'LOGIN'; // helps with some hosts
  $mail->Username   = NSM_MAIL_USER;
  $mail->Password   = NSM_MAIL_PASS;
  if (NSM_MAIL_SECURE === 'ssl' || NSM_MAIL_SECURE === 'tls') {
    $mail->SMTPSecure = NSM_MAIL_SECURE;
  } else {
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS; // sane default
  }

  // From/To
  $mail->setFrom(NSM_MAIL_FROM, NSM_MAIL_FROMNAME);
  $mail->addAddress(NSM_MAIL_TO);

  // Optional BCC list
  if (defined('NSM_MAIL_BCC') && NSM_MAIL_BCC) {
    foreach (explode(',', NSM_MAIL_BCC) as $bcc) {
      $bcc = trim($bcc);
      if ($bcc !== '') $mail->addBCC($bcc);
    }
  }

  // Let you reply to the requester
  $mail->addReplyTo($email, $name);

  $mail->Subject = $subject;
  $mail->isHTML(true);
  $mail->Body    = $bodyHtml;
  $mail->AltBody = $bodyText;

  $mail->send();

  // Optional logging
  if (defined('NSM_MAIL_LOG') && NSM_MAIL_LOG) {
    @file_put_contents(NSM_MAIL_LOG, "[".date('c')."] OK service {$email} -> ".NSM_MAIL_TO.PHP_EOL, FILE_APPEND);
  }

  json_ok('Thanks! Your request has been sent.');
} catch (Exception $e) {
  // Log and return a graceful fallback
  if (defined('NSM_MAIL_LOG') && NSM_MAIL_LOG) {
    @file_put_contents(NSM_MAIL_LOG, "[".date('c')."] FAIL service {$email} :: ".$e->getMessage().PHP_EOL, FILE_APPEND);
  }

  $fallback = [
    'mailto' => 'mailto:' . rawurlencode(NSM_MAIL_TO)
                . '?subject=' . rawurlencode('Service Request')
                . '&body=' . rawurlencode("Name: {$name}\nEmail: {$email}\nPhone: {$phone}\nServices: {$services_str}\n\n{$message}\n"),
  ];
  json_fail('Delivery failed. Use the email link to contact us directly.', 502, $fallback);
}
