<?php require $_SERVER['DOCUMENT_ROOT'] . '/admin/_auth.php'; ?>
<?php
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Protect this page: only allow if admin_logged_in is set in session
  session_start();
  if (empty($_SESSION['admin_logged_in'])) {
    header('Location: /admin/login.php');
    exit;
  }
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admin Dashboard - Neil Smith Media Group</title>

  <!-- Stylesheets -->
  <link rel="stylesheet" href="/css/global.css" />
  <link rel="stylesheet" href="/css/layout.css" />
  <link rel="stylesheet" href="/css/header.css" />
  <link rel="stylesheet" href="/css/navigation.css" />
  <link rel="stylesheet" href="/css/admin.css" />
  <link rel="stylesheet" href="/css/footer.css" />
  <link rel="stylesheet" href="/css/mobile.css" />
</head>
<body>
  <!-- Header -->
  <div id="header-container"></div>
  <script>
    fetch('/header.html')
      .then(res => res.text())
      .then(html => document.getElementById('header-container').innerHTML = html);
  </script>

  <div class="page-container">
    <!-- Left Sidebar -->
    <aside class="sidebar left-sidebar">
      <div id="admin-nav">
        <h2>Admin Navigation</h2>
        <ul>
          <li><button class="admin-button active" data-section="admin-home">Admin Home</button></li>
          <li><button class="admin-button" data-section="manage-posts">Manage Posts</button></li>
          <li><button class="admin-button" data-section="manage-testimonials">Manage Testimonials</button></li>
          <li><button class="admin-button" data-section="website-settings">Website Settings</button></li>
          <li><button class="admin-button" data-section="accounting">Accounting</button></li>
          <li><button class="admin-button" data-section="invoicing">Invoicing</button></li>
          <li><button class="admin-button" data-section="equipment">Equipment</button></li>
          <li><button class="admin-button" data-section="service-requests">Service Requests</button></li>
          <!-- Log out link -->
          <li><a href="/php/admin_logout.php" class="admin-button">Log Out</a></li>
        </ul>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content" id="admin-content">
      <div id="admin-home-content">
        <h1>Admin Dashboard</h1>
        <p>Welcome to the admin panel! Use the navigation on the left to manage different sections.</p>
      </div>
      <!-- Other sections (manage-posts, etc.) are loaded via JS based on data-section -->
    </main>

    <!-- Right Sidebar -->
    <aside class="sidebar right-sidebar"></aside>
  </div>

  <!-- Footer -->
  <div id="footer-container"></div>
  <script>
    fetch('/footer.html')
      .then(res => res.text())
      .then(html => document.getElementById('footer-container').innerHTML = html);
  </script>

  <!-- Load all site-wide JS modules (navigation, dropdowns, etc.) -->
  <script type="module" src="/js/main.js" defer></script>
</body>
</html>


