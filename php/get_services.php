<?php
/**
 * NSM-75: get_services.php
 * Returns a JSON list of services for the homepage.
 * Tries DB first (if configured), then falls back to /json/services.json, otherwise a small static set.
 *
 * Response (success):
 * {
 *   "success": true,
 *   "data": [
 *     {"id":1,"name":"Photography","description":"Portraits, events, products.","icon":"/media/icons/camera.svg","link":"/services/photography.html"},
 *     ...
 *   ]
 * }
 *
 * Response (failure):
 * {"success": false, "data": [], "error": "message"}
 */

declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

// Basic JSON response helper
function respond($ok, $data = [], $error = null) {
  echo json_encode([
    'success' => (bool)$ok,
    'data'    => $data,
    'error'   => $error
  ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
  exit;
}

// Sanitize limit
$limit = 6;
if (isset($_GET['limit'])) {
  $limit = (int)$_GET['limit'];
  if ($limit < 1)  $limit = 1;
  if ($limit > 24) $limit = 24; // safety cap
}

// 1) Try database if available (optional, will be skipped if no config)
$services = [];
try {
  $db_config_path = $_SERVER['DOCUMENT_ROOT'] . '/php/db_config.php';
  if (is_readable($db_config_path)) {
    require_once $db_config_path; // must define $pdo as PDO
    if (isset($pdo) && $pdo instanceof PDO) {
      $stmt = $pdo->prepare('
        SELECT id, name, description, icon, link
        FROM services
        WHERE is_active = 1
        ORDER BY display_order ASC, id ASC
        LIMIT :limit
      ');
      $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
      $stmt->execute();
      $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
      if (is_array($rows)) {
        $services = array_map(function ($r) {
          return [
            'id' => isset($r['id']) ? (int)$r['id'] : null,
            'name' => $r['name'] ?? null,
            'description' => $r['description'] ?? null,
            'icon' => $r['icon'] ?? null,
            'link' => $r['link'] ?? '/services.html',
          ];
        }, $rows);
      }
    }
  }
} catch (Throwable $e) {
  // Fail silently to fallback; do not expose detailed errors.
}

// 2) Fallback to /json/services.json if DB empty/unavailable
if (empty($services)) {
  try {
    $jsonPath = $_SERVER['DOCUMENT_ROOT'] . '/json/services.json';
    if (is_readable($jsonPath)) {
      $json = file_get_contents($jsonPath);
      $data = json_decode($json, true);
      if (is_array($data)) {
        // Support either a top-level array or { data: [...] }
        $arr = $data;
        if (isset($data['data']) && is_array($data['data'])) {
          $arr = $data['data'];
        }
        // Normalize
        $norm = [];
        foreach ($arr as $i => $s) {
          $norm[] = [
            'id' => isset($s['id']) ? (int)$s['id'] : ($i + 1),
            'name' => $s['name'] ?? ($s['title'] ?? 'Service'),
            'description' => $s['description'] ?? ($s['teaser'] ?? ''),
            'icon' => $s['icon'] ?? null,
            'link' => $s['link'] ?? '/services.html',
          ];
        }
        $services = $norm;
      }
    }
  } catch (Throwable $e) {
    // fall through
  }
}

// 3) Final fallback: small static set to prove the pipe works
if (empty($services)) {
  $services = [
    [
      'id' => 1,
      'name' => 'Photography',
      'description' => 'Portraits, events, headshots, and products.',
      'icon' => '/media/icons/camera.svg',
      'link' => '/services/photography.html'
    ],
    [
      'id' => 2,
      'name' => 'Videography',
      'description' => 'Promos, interviews, and event coverage.',
      'icon' => '/media/icons/video.svg',
      'link' => '/services/videography.html'
    ],
    [
      'id' => 3,
      'name' => 'Editing',
      'description' => 'Photo retouching and video post-production.',
      'icon' => '/media/icons/edit.svg',
      'link' => '/services/editing.html'
    ],
    [
      'id' => 4,
      'name' => 'Other Services',
      'description' => 'Notary, officiant, production assistance, and more.',
      'icon' => '/media/icons/more.svg',
      'link' => '/services/other-services.html'
    ]
  ];
}

// Trim to limit
$services = array_slice($services, 0, $limit);

// Respond
respond(true, $services);
