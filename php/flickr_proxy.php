<?php
/**
 * flickr_proxy.php — NSM-86 (scoped, non-destructive)
 * Returns { ok, data, error }, wrapping Flickr REST.
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: max-age=120, public');

$apiKey = getenv('FLICKR_API_KEY');
if (!$apiKey && file_exists(__DIR__ . '/secrets.php')) {
  include __DIR__ . '/secrets.php';
  if (isset($FLICKR_API_KEY)) $apiKey = $FLICKR_API_KEY;
}
if (!$apiKey) { echo json_encode(["ok"=>false,"error"=>"Missing Flickr API key"]); exit; }

$method = $_GET['method'] ?? 'flickr.people.getPublicPhotos';
$params = [
  'method'  => $method,
  'api_key' => $apiKey,
  'format'  => 'json',
  'nojsoncallback' => 1
];
$allow = ['user_id','per_page','page','photoset_id','extras','photo_id'];
foreach ($allow as $k) if (isset($_GET[$k])) $params[$k] = $_GET[$k];
if (!isset($params['per_page'])) $params['per_page'] = 60;
if (!isset($params['extras'])) $params['extras'] = 'date_upload,date_taken,owner_name,tags';

$endpoint = 'https://api.flickr.com/services/rest/?' . http_build_query($params);
$ch = curl_init($endpoint);
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER=>true, CURLOPT_CONNECTTIMEOUT=>10, CURLOPT_TIMEOUT=>20,
  CURLOPT_SSL_VERIFYPEER=>true, CURLOPT_SSL_VERIFYHOST=>2, CURLOPT_USERAGENT=>'NSMG-FlickrProxy/1.0'
]);
$res = curl_exec($ch);
$err = curl_error($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($err || $code >= 400 || !$res) {
  echo json_encode(["ok"=>false,"error"=>$err ? $err : ("HTTP ".$code)]); exit;
}
$data = json_decode($res, true);
if (!$data) { echo json_encode(["ok"=>false,"error"=>"Invalid JSON"]); exit; }
echo json_encode(["ok"=>true,"data"=>$data], JSON_UNESCAPED_SLASHES);
