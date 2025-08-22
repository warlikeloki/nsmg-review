<?php
/**
 * /includes/util.php
 * Common helpers for JSON endpoints.
 */

function json_response(bool $success, $data = null, $error = null, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    $out = ['success' => $success];
    if (!is_null($data))  { $out['data']  = $data; }
    if (!is_null($error)) { $out['error'] = $error; }
    echo json_encode($out);
    exit;
}

function get_int($_arr, string $k, int $default): int {
    return isset($_arr[$k]) && is_numeric($_arr[$k]) ? (int)$_arr[$k] : $default;
}

function get_str($_arr, string $k, string $default = ''): string {
    return isset($_arr[$k]) ? trim((string)$_arr[$k]) : $default;
}

function require_method(string $method): void {
    if (strtoupper($_SERVER['REQUEST_METHOD'] ?? '') !== strtoupper($method)) {
        json_response(false, null, 'Method not allowed', 405);
    }
}

function validate_email(string $email): bool {
    return (bool)filter_var($email, FILTER_VALIDATE_EMAIL);
}
