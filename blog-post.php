<?php
// /blog-post.php
require_once __DIR__ . '/includes/db.php';

$slug = isset($_GET['slug']) ? trim($_GET['slug']) : '';

if ($slug === '') {
    http_response_code(400);
    $title = "Post not specified";
    $desc  = "No post slug was provided.";
    $contentHtml = "<p>Missing slug parameter.</p>";
} else {
    try {
        $pdo = db();
        $stmt = $pdo->prepare("
            SELECT id, slug, title, content, author, tags, published_at, updated_at
            FROM blog_posts
            WHERE slug = :slug AND published_at IS NOT NULL
            LIMIT 1
        ");
        $stmt->execute([':slug' => $slug]);
        $post = $stmt->fetch();

        if (!$post) {
            http_response_code(404);
            $title = "Post not found";
            $desc  = "We couldn't find that article.";
            $contentHtml = "<p>Sorry, that post was not found.</p>";
        } else {
            $title = htmlspecialchars($post['title'] ?? 'Article', ENT_QUOTES, 'UTF-8');
            $plain = trim(preg_replace('/\s+/', ' ', strip_tags($post['content'] ?? '')));
            $desc  = htmlspecialchars(mb_substr($plain, 0, 200), ENT_QUOTES, 'UTF-8');
            $contentHtml = $post['content']; // trusted/curated HTML
            $published = $post['published_at'] ? date('F j, Y', strtotime($post['published_at'])) : '';
            $author    = htmlspecialchars($post['author'] ?? 'Neil Smith Media Group', ENT_QUOTES, 'UTF-8');
            $tags      = $post['tags'] ?? '';
        }
    } catch (Throwable $e) {
        http_response_code(500);
        $title = "Server error";
        $desc  = "An error occurred rendering this article.";
        $contentHtml = "<p>Unexpected error.</p>";
    }
}

$ogImage   = "/media/share-default.jpg"; // swap later to per-post image
$canonical = "/blog-post.php?slug=" . urlencode($slug);
?><!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title><?= $title ?> – Neil Smith Media Group</title>

  <meta name="description" content="<?= $desc ?>" />
  <link rel="canonical" href="<?= $canonical ?>" />

  <meta property="og:title" content="<?= $title ?> – Neil Smith Media Group" />
  <meta property="og:description" content="<?= $desc ?>" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="<?= $canonical ?>" />
  <meta property="og:image" content="<?= $ogImage ?>" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="<?= $title ?> – Neil Smith Media Group" />
  <meta name="twitter:description" content="<?= $desc ?>" />
  <meta name="twitter:image" content="<?= $ogImage ?>" />

  <link rel="stylesheet" href="/css/global.css" />
  <link rel="stylesheet" href="/css/layout.css" />
  <link rel="stylesheet" href="/css/header.css" />
  <link rel="stylesheet" href="/css/navigation.css" />
  <link rel="stylesheet" href="/css/blog.css" />
  <link rel="stylesheet" href="/css/footer.css" />
  <link rel="stylesheet" href="/css/mobile.css" />
</head>
<body>
  <div id="header-container"></div>

  <main id="blog-post-page" class="content-area">
    <article class="blog-post">
      <h1><?= $title ?></h1>
      <?php if (!empty($published)) : ?>
        <p class="meta">By <?= $author ?> • <?= $published ?></p>
      <?php endif; ?>
      <div class="post-content">
        <?= $contentHtml ?>
      </div>
      <?php if (!empty($tags)) : ?>
        <p class="tags">Tags: <?= htmlspecialchars($tags, ENT_QUOTES, 'UTF-8') ?></p>
      <?php endif; ?>
      <p><a href="/blog.html">← Back to Blog</a></p>
    </article>
  </main>

  <div id="footer-container"></div>

  <script>
    (async () => {
      try {
        const header = await fetch('/header.html').then(r => r.text());
        document.getElementById('header-container').innerHTML = header;
        const footer = await fetch('/footer.html').then(r => r.text());
        document.getElementById('footer-container').innerHTML = footer;
      } catch(e) { console.error('Header/Footer load failed', e); }
    })();
  </script>
</body>
</html>
