<?php
/**
 * Global configuration for Neil Smith Media Group site.
 * Keep this file OUTSIDE public_html. Never commit real credentials to GitHub.
 */

/* ======== EDIT THESE (with your real values) ======== */
$__NSMG = [
    'DB_HOST'    => 'localhost',               // HostGator MySQL host
    'DB_NAME'    => 'CPANELUSER_nsmg',         // <-- replace CPANELUSER
    'DB_USER'    => 'CPANELUSER_app',          // <-- replace CPANELUSER
    'DB_PASS'    => 'REPLACE_WITH_STRONG_PASS',// <-- your generated MySQL password
    'APP_DEBUG'  => false                      // set true only when debugging
];
/* ==================================================== */

define('DB_HOST',   $__NSMG['DB_HOST']);
define('DB_NAME',   $__NSMG['DB_NAME']);
define('DB_USER',   $__NSMG['DB_USER']);
define('DB_PASS',   $__NSMG['DB_PASS']);
define('DB_CHARSET','utf8mb4');
define('APP_DEBUG', (bool)$__NSMG['APP_DEBUG']);
