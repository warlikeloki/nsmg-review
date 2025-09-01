<?php require __DIR__ . '/_auth.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoicing Admin</title>
  <link rel="stylesheet" href="/css/wip.css" />
  <script type="module" src="/js/wip.js" defer></script>
</head>
<body>
  <main>
    <h1>Invoicing</h1>
    <table id="invoices-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Invoice #</th>
          <th>Client Name</th>
          <th>Client Email</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Due Date</th>
          <th>Notes</th>
          <th>Created</th>
          <th>Updated</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  </main>
</body>
</html>

