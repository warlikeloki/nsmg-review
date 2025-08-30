<?php
declare(strict_types=1);

/**
 * Runtime security headers for PHP endpoints.
 * Use in addition to the Apache .htaccess headers for defense-in-depth.
 */
$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443);

$headers = [
  'X-Content-Type-Options' => 'nosniff',
  'X-Frame-Options'        => 'SAMEORIGIN',
  'Referrer-Policy'        => 'strict-origin-when-cross-origin',
  'Permissions-Policy'     => "geolocation=(), microphone=(), camera=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=()",
  'X-XSS-Protection'       => '0',
];

foreach ($headers as $k => $v) {
    header($k . ': ' . $v);
}

// Match CSP used in .htaccess (report-only here too, adjust as needed)
header("Content-Security-Policy-Report-Only: default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https:; font-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'self'; frame-src https://challenges.cloudflare.com;");

// HSTS if HTTPS
if ($https) {
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
}

// Remove X-Powered-By if set
header_remove('X-Powered-By');
