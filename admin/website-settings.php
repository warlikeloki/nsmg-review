<?php require $_SERVER['DOCUMENT_ROOT'] . '/admin/_auth.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Website Settings Admin</title>
  <link rel="stylesheet" href="/css/wip.css" />
  <script type="module" src="/js/wip.js" defer></script>
</head>
<body>
  <main>
    <h1>Website Settings</h1>
    <form id="settings-form">
      <label for="site-title">Site Title<span>*</span></label>
      <input type="text" id="site-title" name="site_title" required />

      <label for="meta-description">Meta Description</label>
      <textarea id="meta-description" name="meta_description" rows="3"></textarea>

      <label for="contact-email">Contact Email<span>*</span></label>
      <input type="email" id="contact-email" name="contact_email" required />

      <label for="facebook-url">Facebook URL</label>
      <input type="url" id="facebook-url" name="facebook_url" />

      <label for="instagram-url">Instagram URL</label>
      <input type="url" id="instagram-url" name="instagram_url" />

      <button type="submit" class="btn">Save Settings</button>
      <div id="settings-status" class="form-status"></div>
    </form>
  </main>
</body>
</html>

