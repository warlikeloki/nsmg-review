<?php
// /php/security.php
// Security utilities: CSRF tokens, rate limiting, geo-blocking, etc.

if (session_status() === PHP_SESSION_NONE) {
  session_start();
}

/**
 * CSRF Token Functions
 */
class CSRFProtection {
  const TOKEN_NAME = 'csrf_token';
  const TOKEN_TIME_NAME = 'csrf_token_time';
  const TOKEN_LIFETIME = 3600; // 1 hour

  /**
   * Generate and store a new CSRF token
   */
  public static function generateToken() {
    $token = bin2hex(random_bytes(32));
    $_SESSION[self::TOKEN_NAME] = $token;
    $_SESSION[self::TOKEN_TIME_NAME] = time();
    return $token;
  }

  /**
   * Get the current CSRF token, generating one if needed
   */
  public static function getToken() {
    if (!isset($_SESSION[self::TOKEN_NAME]) || self::isTokenExpired()) {
      return self::generateToken();
    }
    return $_SESSION[self::TOKEN_NAME];
  }

  /**
   * Check if the token has expired
   */
  private static function isTokenExpired() {
    if (!isset($_SESSION[self::TOKEN_TIME_NAME])) {
      return true;
    }
    return (time() - $_SESSION[self::TOKEN_TIME_NAME]) > self::TOKEN_LIFETIME;
  }

  /**
   * Validate a submitted CSRF token
   */
  public static function validateToken($token) {
    if (!isset($_SESSION[self::TOKEN_NAME])) {
      return false;
    }
    if (self::isTokenExpired()) {
      return false;
    }
    return hash_equals($_SESSION[self::TOKEN_NAME], $token);
  }

  /**
   * Validate token from POST request
   */
  public static function validateRequest() {
    $token = $_POST[self::TOKEN_NAME] ?? '';
    return self::validateToken($token);
  }
}

/**
 * Rate Limiting (Session-based)
 */
class RateLimit {
  const SESSION_KEY = 'rate_limit_data';

  // Configurable limits
  private $maxAttempts;
  private $windowSeconds;
  private $identifier;

  /**
   * @param string $identifier Unique identifier for this rate limit (e.g., 'contact_form', 'service_request')
   * @param int $maxAttempts Maximum attempts allowed
   * @param int $windowSeconds Time window in seconds
   */
  public function __construct($identifier, $maxAttempts = 3, $windowSeconds = 300) {
    $this->identifier = $identifier;
    $this->maxAttempts = $maxAttempts;
    $this->windowSeconds = $windowSeconds;
  }

  /**
   * Check if rate limit is exceeded
   * @return array ['allowed' => bool, 'remaining' => int, 'reset_time' => int|null]
   */
  public function check() {
    $this->initializeSession();
    $data = $_SESSION[self::SESSION_KEY][$this->identifier];

    $now = time();
    $attempts = $data['attempts'];
    $windowStart = $data['window_start'];

    // Reset if window has passed
    if ($now - $windowStart > $this->windowSeconds) {
      $this->reset();
      return ['allowed' => true, 'remaining' => $this->maxAttempts, 'reset_time' => null];
    }

    $remaining = $this->maxAttempts - count($attempts);

    if ($remaining <= 0) {
      $resetTime = $windowStart + $this->windowSeconds;
      return [
        'allowed' => false,
        'remaining' => 0,
        'reset_time' => $resetTime,
        'retry_after' => $resetTime - $now
      ];
    }

    return ['allowed' => true, 'remaining' => $remaining, 'reset_time' => null];
  }

  /**
   * Record an attempt
   */
  public function recordAttempt() {
    $this->initializeSession();
    $_SESSION[self::SESSION_KEY][$this->identifier]['attempts'][] = time();
  }

  /**
   * Reset the rate limit for this identifier
   */
  public function reset() {
    $_SESSION[self::SESSION_KEY][$this->identifier] = [
      'attempts' => [],
      'window_start' => time()
    ];
  }

  /**
   * Initialize session data if not exists
   */
  private function initializeSession() {
    if (!isset($_SESSION[self::SESSION_KEY])) {
      $_SESSION[self::SESSION_KEY] = [];
    }
    if (!isset($_SESSION[self::SESSION_KEY][$this->identifier])) {
      $this->reset();
    }
  }

  /**
   * Get human-readable time until reset
   */
  public static function formatRetryAfter($seconds) {
    if ($seconds < 60) {
      return $seconds . ' seconds';
    }
    $minutes = ceil($seconds / 60);
    return $minutes . ' minute' . ($minutes > 1 ? 's' : '');
  }
}

/**
 * Geographic Restriction Helper
 * Note: Requires a geo-IP service to be fully functional
 */
class GeoRestriction {
  const ALLOWED_CONTINENTS = ['NA']; // North America
  const ALLOWED_COUNTRIES = ['US', 'CA', 'MX']; // USA, Canada, Mexico

  /**
   * Check if IP is from allowed region
   * @param string $ip IP address to check
   * @return array ['allowed' => bool, 'country' => string|null, 'continent' => string|null]
   */
  public static function checkIP($ip) {
    // For now, return allowed=true with a note
    // To enable: Install a geo-IP library like MaxMind GeoIP2
    // or use a service like ipapi.co, ip-api.com

    return [
      'allowed' => true,
      'country' => null,
      'continent' => null,
      'note' => 'Geographic restriction not yet enabled. See implementation notes.'
    ];
  }

  /**
   * Example implementation using ip-api.com (free, no key required)
   * Uncomment and use when ready to enable geo-blocking
   */
  /*
  public static function checkIPViaAPI($ip) {
    // Don't block localhost/private IPs
    if (self::isPrivateIP($ip)) {
      return ['allowed' => true, 'country' => 'LOCAL', 'continent' => 'LOCAL'];
    }

    $url = "http://ip-api.com/json/{$ip}?fields=status,continent,continentCode,country,countryCode";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 3);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) {
      // On error, allow by default (fail-open)
      return ['allowed' => true, 'country' => null, 'continent' => null, 'error' => 'API unavailable'];
    }

    $data = json_decode($response, true);
    if (!$data || $data['status'] !== 'success') {
      return ['allowed' => true, 'country' => null, 'continent' => null, 'error' => 'Invalid response'];
    }

    $countryCode = $data['countryCode'] ?? '';
    $continentCode = $data['continentCode'] ?? '';

    $allowed = in_array($countryCode, self::ALLOWED_COUNTRIES) ||
               in_array($continentCode, self::ALLOWED_CONTINENTS);

    return [
      'allowed' => $allowed,
      'country' => $data['country'] ?? null,
      'country_code' => $countryCode,
      'continent' => $data['continent'] ?? null,
      'continent_code' => $continentCode
    ];
  }
  */

  /**
   * Check if IP is private/local
   */
  private static function isPrivateIP($ip) {
    return !filter_var(
      $ip,
      FILTER_VALIDATE_IP,
      FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
    );
  }
}

/**
 * Input Sanitization Helpers
 */
class InputSanitizer {
  /**
   * Sanitize text input (names, messages, etc.)
   */
  public static function sanitizeText($input, $maxLength = 5000) {
    $input = trim($input);
    $input = substr($input, 0, $maxLength);
    // Remove null bytes and control characters except newlines/tabs
    $input = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $input);
    return $input;
  }

  /**
   * Sanitize email
   */
  public static function sanitizeEmail($email) {
    $email = trim($email);
    $email = filter_var($email, FILTER_SANITIZE_EMAIL);
    return $email;
  }

  /**
   * Validate and sanitize phone number
   */
  public static function sanitizePhone($phone) {
    $phone = trim($phone);
    // Remove all non-digit/non-plus/non-space/non-dash/non-parentheses characters
    $phone = preg_replace('/[^0-9+\s\-()x]/i', '', $phone);
    return substr($phone, 0, 30);
  }

  /**
   * Sanitize URL
   */
  public static function sanitizeURL($url) {
    $url = trim($url);
    $url = filter_var($url, FILTER_SANITIZE_URL);
    return $url;
  }

  /**
   * Detect potential spam patterns
   */
  public static function isSpammy($text) {
    $spamPatterns = [
      '/\b(viagra|cialis|casino|lottery|winner)\b/i',
      '/\[url=/i',
      '/\[link=/i',
      '/<a\s+href/i',
      '/http.*http.*http/i', // Multiple URLs
      '/\b\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}\b/', // Credit card patterns
    ];

    foreach ($spamPatterns as $pattern) {
      if (preg_match($pattern, $text)) {
        return true;
      }
    }

    // Check for excessive URLs
    $urlCount = preg_match_all('/(https?:\/\/|www\.)/i', $text);
    if ($urlCount > 3) {
      return true;
    }

    return false;
  }

  /**
   * Check for suspicious patterns that might indicate malicious input
   */
  public static function isSuspicious($text) {
    $suspiciousPatterns = [
      '/<script/i',
      '/javascript:/i',
      '/on\w+\s*=/i', // event handlers like onclick=
      '/<iframe/i',
      '/eval\s*\(/i',
      '/base64_decode/i',
      '/exec\s*\(/i',
    ];

    foreach ($suspiciousPatterns as $pattern) {
      if (preg_match($pattern, $text)) {
        return true;
      }
    }

    return false;
  }
}

/**
 * Security Headers
 */
class SecurityHeaders {
  /**
   * Set all recommended security headers
   */
  public static function setHeaders() {
    // Already set in individual files: Content-Type, Cache-Control

    // Prevent clickjacking
    header('X-Frame-Options: DENY');

    // Prevent MIME type sniffing
    header('X-Content-Type-Options: nosniff');

    // XSS Protection (legacy but still useful)
    header('X-XSS-Protection: 1; mode=block');

    // Referrer policy
    header('Referrer-Policy: strict-origin-when-cross-origin');

    // Permissions policy (limit features)
    header('Permissions-Policy: geolocation=(), microphone=(), camera=()');
  }

  /**
   * Set Content Security Policy
   * Call this from HTML pages, not from API endpoints
   */
  public static function setCSPForForms() {
    $csp = "default-src 'self'; "
         . "script-src 'self' 'unsafe-inline'; "
         . "style-src 'self' 'unsafe-inline'; "
         . "img-src 'self' data: https:; "
         . "font-src 'self' data:; "
         . "connect-src 'self'; "
         . "frame-ancestors 'none';";

    header("Content-Security-Policy: " . $csp);
  }
}
