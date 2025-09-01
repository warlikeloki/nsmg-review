<?php
declare(strict_types=1);
session_start();

// Idle timeout (seconds)
$IDLE_LIMIT = 60 * 30; // 30 minutes

// Renew / enforce idle timeout
if (isset($_SESSION['last_seen'])) {
  if ((time() - (int)$_SESSION['last_seen']) > $IDLE_LIMIT) {
    session_unset();
    session_destroy();
    header('Location: /admin/login.php?timeout=1');
    exit;
  }
}
$_SESSION['last_seen'] = time();

// Require login
if (empty($_SESSION['admin_auth']) || $_SESSION['admin_auth'] !== true) {
  $here = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '/admin/';
  header('Location: /admin/login.php?redir=' . urlencode($here));
  exit;
}
