<?php
// NSM-160 — Pricing API (read-only) with optional is_visible filter
// MySQL 5.7, PHP 8+. If services.is_visible exists, only return rows where is_visible=1.

declare(strict_types=1);

// Optional security headers
$sec = __DIR__ . '/includes/security_headers.php';
if (file_exists($sec)) { @require_once $sec; }

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

$debug = isset($_GET['debug']) && $_GET['debug'] == '1';

/** ------------------------------------------------------------------------
 * DB connection
 * ---------------------------------------------------------------------- */
$pdo = null;

// Prefer shared include if it sets $pdo
$rootDb = dirname(__DIR__) . '/includes/db.php';
if (file_exists($rootDb)) {
  @require_once $rootDb;
}

if (!$pdo) {
  $cfgs = [
    dirname(__DIR__) . '/secure-config/config.php',
    dirname(__DIR__) . '/config/config.php',
  ];
  foreach ($cfgs as $cfg) {
    if (file_exists($cfg)) { @require_once $cfg; }
  }
  $host = defined('DB_HOST') ? DB_HOST : 'localhost';
  $name = defined('DB_NAME') ? DB_NAME : '';
  $user = defined('DB_USER') ? DB_USER : '';
  $pass = defined('DB_PASS') ? DB_PASS : '';

  try {
    $pdo = new PDO("mysql:host={$host};dbname={$name};charset=utf8mb4", $user, $pass, [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
  } catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB connection failed']);
    exit;
  }
}

/** ------------------------------------------------------------------------
 * Feature detect: does services.is_visible exist?
 * ---------------------------------------------------------------------- */
$hasVisible = false;
try {
  $stmt = $pdo->query("
    SELECT COUNT(*) AS c
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'services'
      AND COLUMN_NAME = 'is_visible'
  ");
  $hasVisible = (int)$stmt->fetchColumn() > 0;
} catch (Throwable $e) {
  $hasVisible = false;
}

/** ------------------------------------------------------------------------
 * Build query dynamically so it works with/without is_visible
 * ---------------------------------------------------------------------- */
$selectVisible = $hasVisible ? ", s.is_visible AS is_visible" : "";
$whereVisible  = $hasVisible ? "WHERE s.is_visible = 1" : "";

$sql = "
SELECT
  s.id            AS service_id,
  s.name          AS service_name,
  s.description   AS service_description,
  s.unit          AS service_unit,
  s.is_package    AS is_package
  $selectVisible,
  p.price         AS price,
  GREATEST(COALESCE(s.updated_at, s.created_at), COALESCE(p.updated_at, p.created_at)) AS updated_at
FROM pricing p
JOIN services s ON s.id = p.service_id
$whereVisible
ORDER BY s.is_package DESC, s.name ASC
";

try {
  $stmt = $pdo->query($sql);
  $rows = $stmt->fetchAll();

  $currency = 'USD';
  $updatedMax = null;
  $packages = [];
  $alaCarte = [];

  foreach ($rows as $r) {
    $priceRaw = is_null($r['price']) ? null : (float)$r['price'];
    $unit = $r['service_unit'] ?? null;

    $entry = [
      'id'          => (int)$r['service_id'],
      'service'     => $r['service_name'],
      'description' => $r['service_description'],
      'price'       => $priceRaw,
      'unit'        => $unit,
      'isPackage'   => (int)$r['is_package'] === 1,
      // Include isVisible only if column is present
      'isVisible'   => $hasVisible ? ((int)($r['is_visible'] ?? 1) === 1) : true,

      // Display helpers (optional)
      'PriceDisplay' => is_null($priceRaw) ? '' : ('$' . number_format($priceRaw, 2)),
      'Service'      => $r['service_name'],
      'Description'  => $r['service_description'],
      'Unit'         => $unit,
    ];

    if (!empty($r['updated_at'])) {
      $ts = strtotime($r['updated_at']);
      if ($ts && ($updatedMax === null || $ts > $updatedMax)) $updatedMax = $ts;
    }

    if ((int)$r['is_package'] === 1) {
      $packages[] = $entry;
    } else {
      $alaCarte[] = $entry;
    }
  }

  $payload = [
    'currency'  => $currency,
    'updatedAt' => $updatedMax ? gmdate('c', $updatedMax) : null,
    'packages'  => $packages,
    'alaCarte'  => $alaCarte,
  ];

  echo $debug
    ? json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
    : json_encode($payload, JSON_UNESCAPED_SLASHES);

} catch (Throwable $e) {
  if ($debug) {
    http_response_code(500);
    echo json_encode(['error' => 'Query failed', 'detail' => $e->getMessage()]);
  } else {
    http_response_code(500);
    echo json_encode(['error' => 'Query failed']);
  }
}
