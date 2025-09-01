<?php
declare(strict_types=1);
session_start();
require_once __DIR__ . '/../php/includes/admin_auth.php';

function csrf_token(): string {
  if (empty($_SESSION['csrf'])) {
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
  }
  return $_SESSION['csrf'];
}
function verify_csrf(string $t): bool {
  return isset($_SESSION['csrf']) && hash_equals($_SESSION['csrf'], $t);
}
function sanitize_admin_path(?string $p, string $default): string {
  if (!is_string($p) || $p === '') return $default;
  $path = parse_url($p, PHP_URL_PATH);
  if (!is_string($path) || $path === '') return $default;
  // Only allow paths under /admin
  if ($path === '/admin' || $path === '/admin/') return $default;
  if (strpos($path, '/admin/') !== 0) return $default;
  if ($path === '/admin/login.php') return $default;
  return $path;
}

$DEFAULT_AFTER_LOGIN = '/admin/index.php';
$redir = isset($_GET['redir']) ? sanitize_admin_path($_GET['redir'], $DEFAULT_AFTER_LOGIN) : $DEFAULT_AFTER_LOGIN;
$err   = '';
$timeout = isset($_GET['timeout']) ? true : false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $token = $_POST['csrf'] ?? '';
  if (!verify_csrf($token)) {
    $err = 'Invalid security token. Please try again.';
  } else {
    $u = trim((string)($_POST['user'] ?? ''));
    $p = (string)($_POST['pass'] ?? '');
    ['user' => $cfgUser, 'pass_hash' => $cfgHash] = nsmg_admin_secrets();

    if ($u === $cfgUser && password_verify($p, $cfgHash)) {
      $_SESSION['admin_auth'] = true;
      $_SESSION['last_seen']  = time();
      unset($_SESSION['csrf']); // rotate after login
      $postedRedir = sanitize_admin_path($_POST['redir'] ?? '', $DEFAULT_AFTER_LOGIN);
      header('Location: ' . $postedRedir);
      exit;
    } else {
      $err = 'Invalid username or password.';
    }
  }
}
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Admin Login</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#f6f7fb;margin:0;display:flex;min-height:100vh;align-items:center;justify-content:center}
  .card{background:#fff;max-width:380px;width:92%;padding:24px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.08)}
  h1{font-size:1.25rem;margin:0 0 12px}
  .msg{margin:8px 0 0;color:#d33;font-size:.95rem}
  .ok{color:#2a7}
  label{display:block;margin:12px 0 4px}
  input[type=text],input[type=password]{width:100%;padding:10px 12px;border:1px solid #d0d4dd;border-radius:8px;font-size:1rem}
  button{margin-top:14px;width:100%;padding:10px 12px;border:0;border-radius:8px;background:#2b6cb0;color:#fff;font-size:1rem;cursor:pointer}
  button:hover{background:#225a91}
  .hint{color:#667; font-size:.85rem; margin-top:8px}
</style>
</head>
<body>
  <form class="card" method="post" action="/admin/login.php">
    <h1>Admin Login</h1>
    <?php if ($timeout): ?>
      <div class="msg">You were logged out due to inactivity. Please sign in again.</div>
    <?php endif; ?>
    <?php if ($err): ?>
      <div class="msg"><?=htmlspecialchars($err, ENT_QUOTES)?></div>
    <?php endif; ?>

    <label for="user">Username</label>
    <input id="user" name="user" type="text" autocomplete="username" required>

    <label for="pass">Password</label>
    <input id="pass" name="pass" type="password" autocomplete="current-password" required>

    <input type="hidden" name="csrf" value="<?=htmlspecialchars(csrf_token(), ENT_QUOTES)?>">
    <input type="hidden" name="redir" value="<?=htmlspecialchars($redir, ENT_QUOTES)?>">
    <button type="submit">Sign In</button>
    <div class="hint">Use the admin credentials set in <code>/home4/…/private/admin_auth_config.php</code>.</div>
  </form>
</body>
</html>
