<?php
// /php/get_equipment.php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/util.php';

nsmg_nocache();
require_method('GET');

$category = get_str($_GET,'category','');
$q        = get_str($_GET,'q','');
$limit    = max(0, get_int($_GET,'limit',0));

$sql = "SELECT
          id,
          name,
          category,
          description,
          thumbnail_url,
          manufacturer,
          model_number,
          `condition`,
          is_retired,
          types
        FROM equipment
        WHERE 1=1";
$params = [];

if ($category !== '') {
  $sql .= " AND category = :category";
  $params[':category'] = $category;
}
if ($q !== '') {
  $sql .= " AND (name LIKE :q OR description LIKE :q OR manufacturer LIKE :q OR model_number LIKE :q)";
  $params[':q'] = "%{$q}%";
}

$sql .= " ORDER BY category ASC, name ASC";
if ($limit > 0) $sql .= " LIMIT :limit";

try {
  $pdo = db();
  $stmt = $pdo->prepare($sql);
  foreach ($params as $k=>$v) $stmt->bindValue($k,$v);
  if ($limit>0) $stmt->bindValue(':limit',$limit,PDO::PARAM_INT);
  $stmt->execute();
  $rows = $stmt->fetchAll();

  // Normalize types: ensure JS gets an array (not a JSON string)
  foreach ($rows as &$r) {
    if (array_key_exists('types',$r) && $r['types'] !== null) {
      // $r['types'] is JSON text in MySQL; decode to PHP array
      $decoded = json_decode($r['types'], true);
      $r['types'] = is_array($decoded) ? $decoded : null;
    } else {
      $r['types'] = null;
    }
  }

  json_response(true, $rows);
} catch (Throwable $e) {
  json_response(false, null, APP_DEBUG ? $e->getMessage() : 'Failed to load equipment', 500);
}
