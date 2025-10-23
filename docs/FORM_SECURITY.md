# Contact Form Security Features

## Overview

This document describes the security enhancements implemented for the contact and service request forms on the Neil Smith Media Group website.

## Implemented Security Features

### 1. CSRF (Cross-Site Request Forgery) Protection

**What it does:** Prevents malicious websites from submitting forms on your behalf.

**How it works:**
- A unique token is generated for each user session
- The token is automatically fetched when forms load
- Forms cannot be submitted without a valid token
- Tokens expire after 1 hour

**Files:**
- [php/security.php](../php/security.php) - `CSRFProtection` class
- [php/get_csrf_token.php](../php/get_csrf_token.php) - Token endpoint
- [js/modules/contact.js](../js/modules/contact.js) - Frontend integration
- [js/modules/service-request.js](../js/modules/service-request.js) - Frontend integration

### 2. Rate Limiting

**What it does:** Prevents spam by limiting the number of form submissions.

**Current limits:**
- 3 submissions per 5 minutes per session
- Separate limits for contact form and service request form
- User-friendly error messages with retry time

**How it works:**
- Session-based tracking (resets when browser closes)
- Can be upgraded to IP-based or database-backed in the future

**Files:**
- [php/security.php](../php/security.php) - `RateLimit` class
- Applied in [php/submit_contact.php:47-52](../php/submit_contact.php#L47-L52)
- Applied in [php/submit_service_request.php:47-52](../php/submit_service_request.php#L47-L52)

**To adjust limits:**
```php
// In submit_contact.php or submit_service_request.php
$rateLimit = new RateLimit('contact_form', 3, 300);
//                          identifier    max  seconds
```

### 3. Input Sanitization & Validation

**What it does:** Cleans and validates all user input to prevent attacks.

**Features:**
- Removes control characters and null bytes
- Enforces maximum field lengths
- Email validation
- Phone number sanitization
- URL sanitization

**Files:**
- [php/security.php](../php/security.php) - `InputSanitizer` class

### 4. Spam Detection

**What it does:** Automatically detects and blocks common spam patterns.

**Detection patterns:**
- Common spam keywords (viagra, casino, lottery, etc.)
- Multiple URLs in messages
- Credit card number patterns
- BBCode/HTML link syntax
- Excessive URL count (>3)

**How it works:**
- Spam is silently rejected (returns success to avoid alerting spammers)
- Spam attempts are logged to the mail log file
- Includes IP address for tracking

**Files:**
- [php/security.php](../php/security.php) - `InputSanitizer::isSpammy()`

### 5. Malicious Input Detection

**What it does:** Detects potential XSS and injection attempts.

**Detection patterns:**
- `<script>` tags
- JavaScript protocol handlers
- Event handler attributes (onclick, onload, etc.)
- `<iframe>` tags
- `eval()` and `exec()` functions
- Base64 decode attempts

**How it works:**
- Returns user-facing error message
- Does NOT send email if suspicious input detected

**Files:**
- [php/security.php](../php/security.php) - `InputSanitizer::isSuspicious()`

### 6. Honeypot Field

**What it does:** Catches basic bots by using a hidden field.

**How it works:**
- Hidden field named "website" is invisible to humans
- Bots often auto-fill all fields
- If filled, submission is silently rejected

**Already implemented in:**
- [contact.html](../contact.html)
- [services/request-form.html](../services/request-form.html)

### 7. Security Headers

**What it does:** Adds HTTP headers to protect against various attacks.

**Headers set:**
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - XSS protection (legacy browsers)
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer info
- `Permissions-Policy` - Restricts browser features (geolocation, camera, mic)

**Files:**
- [php/security.php](../php/security.php) - `SecurityHeaders` class
- Applied in both form handlers

### 8. Environment Variables (.env)

**What it does:** Keeps sensitive credentials out of code.

**How it works:**
- Credentials stored in `.env` file
- `.env` file is in `.gitignore` (never committed to git)
- `.env.example` provides template

**Setup:**
1. Copy `.env.example` to `.env`
2. Fill in your actual credentials
3. Delete old hardcoded values from `php/mail_config.php` (optional, fallbacks remain)

**Files:**
- [.env](../.env) - Actual credentials (not in git)
- [.env.example](../.env.example) - Template (committed to git)
- [php/mail_config.php](../php/mail_config.php) - Loads .env file

### 9. Geographic Restriction (Ready for Future Use)

**What it does:** Allows restricting form access to specific regions.

**Current status:** Helper code ready, but disabled by default.

**To enable (when ready):**

1. Uncomment the `checkIPViaAPI()` method in [php/security.php](../php/security.php)
2. Add geo-check to form handlers:

```php
$geoCheck = GeoRestriction::checkIPViaAPI($_SERVER['REMOTE_ADDR']);
if (!$geoCheck['allowed']) {
  json_fail('Service not available in your region.', 403);
}
```

**Pre-configured for:** North America (USA, Canada, Mexico)

**Uses:** Free ip-api.com service (no API key needed)

**Files:**
- [php/security.php](../php/security.php) - `GeoRestriction` class

## Logging

All security events are logged to the mail log file (if enabled):

**Log location:** Defined by `NSM_MAIL_LOG` in `.env`

**What's logged:**
- Successful submissions
- Failed submissions
- Spam detections (with IP address)
- Email delivery failures

**To enable logging:**
```env
# In .env file
NSM_MAIL_LOG=logs/mail.log
```

## Testing

### Test CSRF Protection
1. Open contact form
2. Wait 1 hour (or manually clear session)
3. Try to submit - should see "Security token expired" message

### Test Rate Limiting
1. Submit contact form 3 times quickly
2. 4th attempt should be rejected with "Too many submissions" message
3. Wait 5 minutes, should work again

### Test Spam Detection
1. Try submitting with text like "You won the lottery! Click here: http://spam.com"
2. Should appear to succeed but email won't be sent (check logs)

### Test Input Validation
1. Try submitting with `<script>alert('xss')</script>` in message
2. Should be rejected with "Invalid input detected" message

## Upgrading Rate Limiting

### Current: Session-based
- Limits reset when browser closes
- No server storage needed
- Per-user session tracking

### Future Option 1: IP-based with File Storage

Add this to `php/security.php`:

```php
class IPRateLimit {
  private $storageFile;
  private $identifier;
  private $maxAttempts;
  private $windowSeconds;

  public function __construct($identifier, $maxAttempts = 3, $windowSeconds = 300) {
    $this->identifier = $identifier;
    $this->maxAttempts = $maxAttempts;
    $this->windowSeconds = $windowSeconds;
    $this->storageFile = __DIR__ . '/../storage/rate_limit_' . $identifier . '.json';
  }

  public function check() {
    $ip = $_SERVER['REMOTE_ADDR'];
    $data = $this->loadData();
    $now = time();

    if (!isset($data[$ip])) {
      return ['allowed' => true, 'remaining' => $this->maxAttempts];
    }

    $attempts = array_filter($data[$ip], function($timestamp) use ($now) {
      return ($now - $timestamp) <= $this->windowSeconds;
    });

    $remaining = $this->maxAttempts - count($attempts);
    return [
      'allowed' => $remaining > 0,
      'remaining' => max(0, $remaining),
      'retry_after' => $remaining <= 0 ? $this->windowSeconds : null
    ];
  }

  public function recordAttempt() {
    $ip = $_SERVER['REMOTE_ADDR'];
    $data = $this->loadData();
    if (!isset($data[$ip])) $data[$ip] = [];
    $data[$ip][] = time();
    $this->saveData($data);
  }

  private function loadData() {
    if (!file_exists($this->storageFile)) return [];
    $json = file_get_contents($this->storageFile);
    return json_decode($json, true) ?: [];
  }

  private function saveData($data) {
    $dir = dirname($this->storageFile);
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    file_put_contents($this->storageFile, json_encode($data));
  }
}
```

Then in form handlers, replace `RateLimit` with `IPRateLimit`.

### Future Option 2: Database-backed

```sql
CREATE TABLE rate_limits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  identifier VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  attempt_time INT NOT NULL,
  INDEX idx_lookup (identifier, ip_address, attempt_time)
);
```

```php
class DBRateLimit {
  // Similar to IPRateLimit but queries database
  // Query: SELECT COUNT(*) FROM rate_limits
  //        WHERE identifier = ? AND ip_address = ?
  //        AND attempt_time > ?
}
```

## Troubleshooting

### Forms not working after update

**Symptom:** "Invalid or expired security token" error

**Solution:**
1. Make sure `php/get_csrf_token.php` is accessible
2. Check browser console for JavaScript errors
3. Ensure `session_start()` is working (check PHP session settings)
4. Verify sessions are enabled: `php -i | grep session`

### Rate limiting too strict

**Symptom:** Users complaining they can't submit multiple inquiries

**Solution:**
```php
// In submit_contact.php, increase limits:
$rateLimit = new RateLimit('contact_form', 5, 600); // 5 per 10 minutes
```

### Legitimate messages marked as spam

**Symptom:** User reports message not received, logs show "SPAM DETECTED"

**Solution:**
1. Check the spam patterns in `InputSanitizer::isSpammy()`
2. Adjust or remove overly aggressive patterns
3. Consider whitelisting trusted email addresses

### CSRF tokens expiring too quickly

**Symptom:** Users on slow connections getting token expired errors

**Solution:**
```php
// In php/security.php, increase token lifetime:
class CSRFProtection {
  const TOKEN_LIFETIME = 7200; // 2 hours instead of 1
}
```

## Security Best Practices

1. ✅ **Never commit** `.env` file to version control
2. ✅ **Use strong app passwords** for email accounts
3. ✅ **Enable 2FA** on email accounts
4. ✅ **Review logs regularly** for suspicious activity
5. ✅ **Keep PHPMailer updated** (`composer update`)
6. ✅ **Use HTTPS** in production
7. ✅ **Limit error messages** to avoid information disclosure
8. ⏳ **Consider adding** Google reCAPTCHA v3 for extra protection
9. ⏳ **Consider enabling** geographic restrictions when ready

## Adding reCAPTCHA (Optional Future Enhancement)

If spam continues to be a problem:

1. **Sign up** at https://www.google.com/recaptcha/admin
2. **Choose** reCAPTCHA v3 (invisible, no user interaction)
3. **Add to frontend** (in contact.html):
```html
<script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>
<script>
  grecaptcha.ready(function() {
    grecaptcha.execute('YOUR_SITE_KEY', {action: 'contact'}).then(function(token) {
      // Add token to form data
      data.append('recaptcha_token', token);
    });
  });
</script>
```

4. **Verify in backend** (add to submit_contact.php):
```php
$recaptchaToken = $_POST['recaptcha_token'] ?? '';
$recaptchaSecret = 'YOUR_SECRET_KEY';

$verify = file_get_contents(
  'https://www.google.com/recaptcha/api/siteverify?' . http_build_query([
    'secret' => $recaptchaSecret,
    'response' => $recaptchaToken,
    'remoteip' => $_SERVER['REMOTE_ADDR']
  ])
);

$response = json_decode($verify);
if (!$response->success || $response->score < 0.5) {
  json_fail('reCAPTCHA verification failed.');
}
```

**Cost:** Free for most sites

**Effectiveness:** Very high (Google's ML-based bot detection)

## Files Modified

### New Files Created
- `php/security.php` - Main security library
- `php/get_csrf_token.php` - CSRF token endpoint
- `.env` - Environment variables (credentials)
- `.env.example` - Template for environment variables
- `docs/FORM_SECURITY.md` - This documentation

### Files Modified
- `php/submit_contact.php` - Added all security features
- `php/submit_service_request.php` - Added all security features
- `php/mail_config.php` - Updated to load from .env
- `js/modules/contact.js` - Added CSRF token handling
- `js/modules/service-request.js` - Added CSRF token handling

### Existing Security Features (Unchanged)
- Honeypot fields in HTML forms
- HTML output encoding
- Email validation
- SMTP with TLS encryption

## Summary of Protection Layers

| Layer | Feature | Blocks |
|-------|---------|--------|
| 1 | Honeypot | Basic bots |
| 2 | CSRF Tokens | Cross-site attacks |
| 3 | Rate Limiting | Spam floods |
| 4 | Input Sanitization | Malformed data |
| 5 | Spam Detection | Common spam patterns |
| 6 | Malicious Input Detection | XSS/injection attempts |
| 7 | Security Headers | Clickjacking, MIME sniffing |
| 8 | Geographic Restriction (optional) | Non-North America traffic |

**Defense in Depth:** Multiple layers ensure that if one layer is bypassed, others still protect the system.

## Contact

For questions about these security features, consult this documentation or review the inline comments in the source files.
