<?php
declare(strict_types=1);
$err = '';
$hash = '';
$algo = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $pw = (string)($_POST['pw'] ?? '');
  if (strlen($pw) < 10) {
    $err = 'Use at least 10 characters.';
  } else {
    $hash = password_hash($pw, PASSWORD_DEFAULT);
    $info = password_get_info($hash);
    $algo = ($info['algoName'] ?? 'unknown');
  }
}
?>
<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Password Hash Generator (one-time)</title>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#f6f7fb;margin:0;display:flex;min-height:100vh;align-items:center;justify-content:center}
  .card{background:#fff;max-width:560px;width:92%;padding:24px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.08)}
  h1{font-size:1.25rem;margin:0 0 12px}
  label{display:block;margin:12px 0 4px}
  input[type=password]{width:100%;padding:10px 12px;border:1px solid #d0d4dd;border-radius:8px;font-size:1rem}
  button{margin-top:14px;padding:10px 12px;border:0;border-radius:8px;background:#2b6cb0;color:#fff;font-size:1rem;cursor:pointer}
  .msg{margin-top:10px;color:#d33}
  textarea{width:100%;height:120px;margin-top:10px;font-family:ui-monospace,Consolas,monospace}
  .hint{color:#667;font-size:.9rem;margin-top:8px}
</style>
</head><body>
  <form class="card" method="post">
    <h1>Generate Password Hash</h1>
    <p class="hint">This page does not store anything; it only prints a hash so you can paste it into <code>php/includes/admin_auth_config.php</code>. Delete this file after use.</p>
    <label for="pw">New admin password</label>
    <input id="pw" name="pw" type="password" required minlength="10" autocomplete="new-password">
    <button type="submit">Generate Hash</button>
    <?php if ($err): ?><div class="msg"><?=htmlspecialchars($err, ENT_QUOTES)?></div><?php endif; ?>
    <?php if ($hash): ?>
      <div class="hint">Algorithm: <?=htmlspecialchars($algo, ENT_QUOTES)?></div>
      <label for="out">Copy this hash:</label>
      <textarea id="out" readonly><?=htmlspecialchars($hash, ENT_QUOTES)?></textarea>
      <div class="hint">Next: put this hash into <code>$config['pass_hash']</code> on the server.</div>
    <?php endif; ?>
  </form>
</body></html>
