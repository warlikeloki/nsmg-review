<?php
return [
  'smtp' => [
    // Gmail SMTP
    'host'      => 'smtp.gmail.com',
    // Choose ONE of these pairs (both work):
    // Option 1 (recommended): SSL on 465
    'port'      => 465,
    'secure'    => 'ssl',
    // Option 2: STARTTLS on 587
    // 'port'   => 587,
    // 'secure' => 'tls',

    'username'  => 'contact@neilsmith.org',          // full email address
    'password'  => 'dmelthvhcdsjvgxx',          // the app password you generated

    'from'      => 'contact@neilsmith.org',
    'from_name' => 'Neil Smith Media Group',
    'to'        => 'contact@neilsmith.org'           // where notifications go
  ]
];