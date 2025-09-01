<?php require __DIR__ . '/_auth.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Service Requests Admin</title>
  <link rel="stylesheet" href="/css/wip.css" />
  <script type="module" src="/js/wip.js" defer></script>
</head>
<body>
  <main>
    <h1>Service Requests</h1>
    <table id="service-requests-table">
      <thead>
        <tr>
          <th>ID</th><th>Name</th><th>Email</th><th>Phone</th>
          <th>Services</th><th>Preferred Date</th>
          <th>Location</th><th>Duration</th><th>Details</th><th>Submitted</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  </main>
</body>
</html>

