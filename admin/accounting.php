<?php require __DIR__ . '/_auth.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accounting Admin</title>
  <link rel="stylesheet" href="/css/wip.css" />
  <script type="module" src="/js/wip.js" defer></script>
</head>
<body>
  <main>
    <h1>Accounting</h1>
    <table id="accounting-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Date</th>
          <th>Type</th>
          <th>Category</th>
          <th>Amount</th>
          <th>Description</th>
          <th>Reference</th>
          <th>Created</th>
          <th>Updated</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  </main>
</body>
</html>

