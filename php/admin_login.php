<?php
session_start();

// 1. Load your DB connection (adjust path if needed)
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/util.php'; 
// db_connect.php should set up a PDO instance in $pdo, e.g.
//   $pdo = new PDO('mysql:host=localhost;dbname=your_db;charset=utf8', 'user', 'pass', [...]);

// 2. Initialize error message
$error = '';

// 3. Process form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($username === '' || $password === '') {
        $error = 'Please enter both username and password.';
    } else {
        // 4. Look up the admin by username
        $stmt = $pdo->prepare('SELECT id, username, password_hash FROM admins WHERE username = :username');
        $stmt->execute(['username' => $username]);
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);

        // 5. Verify password
        if ($admin && password_verify($password, $admin['password_hash'])) {
            // 6. Success: set session and redirect
            $_SESSION['admin_logged_in']  = true;
            $_SESSION['admin_username']   = $admin['username'];
            header('Location: /admin/admin.html');
            exit;
        } else {
            $error = 'Invalid username or password.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Admin Login</title>
  <link rel="stylesheet" href="/css/global.css" />
  <link rel="stylesheet" href="/css/forms.css" />
</head>
<body>
<div class="login-wrapper">
  <main class="admin-login">
    <h1>Admin Login</h1>

    <?php if ($error): ?>
      <p class="error"><?php echo htmlspecialchars($error, ENT_QUOTES, 'UTF-8'); ?></p>
    <?php endif; ?>

    <form action="/php/login.php" method="POST">
      <div class="form-group">
        <label for="username">Username</label>
        <input type="text" id="username" name="username" value="<?php echo htmlspecialchars($username ?? '', ENT_QUOTES, 'UTF-8'); ?>" required />
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required />
      </div>
      <button type="submit" class="btn">Log In</button>
    </form>

    <p><a href="/admin/login.html">← Back to Login</a></p>
  </main>
    </div>
</body>
</html>