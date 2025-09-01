<?php require $_SERVER['DOCUMENT_ROOT'] . '/admin/_auth.php'; ?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Admin Home</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:24px}
    a{display:inline-block;margin:6px 0}
  </style>
</head>
<body>
  <h1>Admin Home</h1>
  <p>Welcome. Choose a section:</p>
  <nav>
    <a href="/admin/manage-posts.php">Manage Posts</a><br>
    <a href="/admin/manage-testimonials.php">Manage Testimonials</a><br>
    <a href="/admin/service-requests.php">Service Requests</a><br>
    <a href="/admin/website-settings.php">Website Settings</a><br>
    <a href="/admin/logout.php">Log out</a>
  </nav>
</body>
</html>
