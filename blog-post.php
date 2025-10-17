<?php
// /blog-post.php — minimal shell (no server-side parameter checks)
// Accepts ?id= or ?slug= but does NOT require them. JS fetches and renders content.
// Unique marker for cache-bust verification: NSMG-PHP-MARKER-20251013-A

$id   = isset($_GET['id'])   ? trim($_GET['id'])   : '';
$slug = isset($_GET['slug']) ? trim($_GET['slug']) : '';

function esc_attr($s) { return htmlspecialchars($s ?? '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
?><!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Blog Post - Neil Smith Media Group</title>

  <!-- Standard site CSS -->
  <link rel="stylesheet" href="/css/global.css"/>
  <link rel="stylesheet" href="/css/layout.css"/>
  <link rel="stylesheet" href="/css/header.css"/>
  <link rel="stylesheet" href="/css/sticky-header.css" />
  <link rel="stylesheet" href="/css/navigation.css"/>
  <link rel="stylesheet" href="/css/blog.css"/>
  <link rel="stylesheet" href="/css/footer.css"/>
  <link rel="stylesheet" href="/css/mobile.css"/>

  <!-- Scoped blog post CSS -->
  <link rel="stylesheet" href="/css/blog-post-page.css"/>

  <!-- Pass params to JS as an optional fallback -->
  <script>
    window.__BLOG_POST_PARAMS__ = {
      id:   "<?= esc_attr($id) ?>",
      slug: "<?= esc_attr($slug) ?>"
    };
  </script>

  <!-- Marker so you can View Source and confirm the right file is live -->
  <meta name="nsmg-marker" content="NSMG-PHP-MARKER-20251013-A">
</head>
<body>
  <!-- Header include -->
  <div id="header-container"></div>

  <main id="blog-post-page">
    <p id="post-status" class="status-note"></p>
    <div class="post-hero"></div>
    <h1 class="post-title"></h1>
    <div class="post-meta"></div>
    <article class="post-content"></article>
    <p style="margin-top:1.5rem;">
      <a href="/blog.html" class="back-link">← Back to Blog</a>
    </p>
  </main>

  <!-- Footer include -->
  <div id="footer-container"></div>

  <!-- Header/Footer injection -->
  

  <!-- Single-post script (already supports ?id= or ?slug=) -->
  <script src="/js/modules/blog-post.js?v=2025-10-13" defer></script>
</body>
</html>
