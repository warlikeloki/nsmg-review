<?php
// /php/get_equipment.php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/util.php';

nsmg_nocache();
require_method('GET');

$category = get_str($_GET,'category','');  // CSV membership tag: photography | videography | editing ...
$q        = get_str($_GET,'q','');
$limit    = max(0, get_int($_GET,'limit',0));

$sql = "SELECT
          id,
          name,
          category,          -- CSV of use-tags (e.g., 'photography, videography')
          types,             -- gear class (camera, lens, lighting, etc.)
          description,
          thumbnail_url,
          manufacturer,
          model_number,
          `condition`,
          is_retired
        FROM equipment
        WHERE 1=1";
$params = [];

if ($category !== '') {
  $sql .= " AND FIND_IN_SET(:cat, REPLACE(category, ', ', ','))";
  $params[':cat'] = $category;
}

if ($q !== '') {
  $sql .= " AND (name LIKE :q OR description LIKE :q OR manufacturer LIKE :q OR model_number LIKE :q)";
  $params[':q'] = "%{$q}%";
}

$sql .= " ORDER BY name ASC";
if ($limit > 0) $sql .= " LIMIT :limit";

try {
  $pdo = db();
  $stmt = $pdo->prepare($sql);
  foreach ($params as $k=>$v) $stmt->bindValue($k,$v);
  if ($limit>0) $stmt->bindValue(':limit',$limit,PDO::PARAM_INT);
  $stmt->execute();
  json_response(true, $stmt->fetchAll());
} catch (Throwable $e) {
  json_response(false, null, APP_DEBUG ? $e->getMessage() : 'Failed to load equipment', 500);
}
