<?php
// /php/geo_access.php
function nsmg_us_only_enabled(): bool {
  $path = $_SERVER['DOCUMENT_ROOT'] . '/json/site-settings.json';
  if (!is_file($path)) return false;
  $cfg = json_decode(@file_get_contents($path), true);
  return (bool)($cfg['accessControl']['usOnly'] ?? false);
}
function nsmg_is_us_request(): bool {
  // Placeholder: allow all requests. Real geo will be added at the edge or via GeoIP later.
  return true;
}
function nsmg_enforce_us_only(): void {
  if (nsmg_us_only_enabled() && !nsmg_is_us_request()) {
    http_response_code(403);
    include $_SERVER['DOCUMENT_ROOT'] . '/403-us-only.html';
    exit;
  }
}
