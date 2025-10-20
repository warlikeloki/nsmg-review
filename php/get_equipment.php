<?php
// /php/get_equipment.php
// Returns equipment filtered by service tag membership in CSV column `category`
// (e.g., "photography, videography"). The UI groups by GEAR CLASS, which
// comes from `types` and is exposed as `category` in the response.
//
// Response shape (via json_response):
//   { "success": true, "data": [ { id, name, category, description, thumbnail_url, manufacturer, model_number, model, condition, is_retired, service_tags } ] }
//
// Notes:
// - `category` in the RESPONSE = gear class (camera, lens, lighting, ...), from DB column `types`.
// - Service filter still uses DB column `category` (CSV), exposed as `service_tags` in the response.
// - Includes BOTH `model_number` and `model` (alias of model_number) for frontend compatibility.

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/util.php';

nsmg_nocache();
require_method('GET');

$serviceFilter = get_str($_GET, 'category', '');   // photography | videography | editing | other ...
$q             = get_str($_GET, 'q', '');
$limit         = max(0, get_int($_GET, 'limit', 0));

$sql = "SELECT
          id,
          name,
          -- Gear class -> 'category' for frontend grouping
          types AS category,
          -- Original CSV service tags preserved
          category AS service_tags,
          description,
          thumbnail_url,
          manufacturer,
          model_number,           -- keep original column
          model_number AS model,  -- convenience alias for frontends expecting 'model'
          `condition`,
          is_retired
        FROM equipment
        WHERE 1=1";
$params = [];

/*
  Service filter on CSV `category` column.
  Normalize spaces so FIND_IN_SET works with either 'a, b' or 'a,b'.
*/
if ($serviceFilter !== '') {
  $sql .= " AND FIND_IN_SET(:svc, REPLACE(category, ', ', ','))";
  $params[':svc'] = $serviceFilter;
}

/*
  Text search across common fields
*/
if ($q !== '') {
  $sql .= " AND (name LIKE :q OR description LIKE :q OR manufacturer LIKE :q OR model_number LIKE :q)";
  $params[':q'] = "%{$q}%";
}

/*
  Order for tidy grouping in UI
*/
$sql .= " ORDER BY types ASC, name ASC";

if ($limit > 0) {
  $sql .= " LIMIT :limit";
}

try {
  $pdo = db();
  $stmt = $pdo->prepare($sql);

  foreach ($params as $k => $v) {
    $stmt->bindValue($k, $v);
  }
  if ($limit > 0) {
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
  }

  $stmt->execute();
  $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

  // Normalize service_tags spacing to "a, b, c"
  foreach ($rows as &$r) {
    if (isset($r['service_tags'])) {
      $csv = str_replace(', ', ',', (string)$r['service_tags']);
      $parts = array_filter(array_map('trim', explode(',', $csv)), static fn($s) => $s !== '');
      $r['service_tags'] = implode(', ', $parts);
    }
  }

  json_response(true, $rows); // { success: true, data: [...] }
} catch (Throwable $e) {
  json_response(false, null, APP_DEBUG ? $e->getMessage() : 'Failed to load equipment', 500);
}
