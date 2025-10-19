<?php
// /service_request.php
?><!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>Request Services | Neil Smith Media Group</title>
  <meta name="description" content="Request photography, videography, editing, or other services from Neil Smith Media Group." />
  <link rel="stylesheet" href="/css/base.css">
  <link rel="stylesheet" href="/css/forms.css">
</head>
<body>
  <div id="header-container"></div>
  <script>fetch('/header.html').then(r=>r.text()).then(h=>{document.getElementById('header-container').innerHTML=h})</script>

  <main class="container">
    <h1>Service Request</h1>
    <p>Tell us what you need. We’ll follow up with details and availability.</p>

    <form id="service-request-form" class="form-grid" method="post" action="/php/submit_service_request.php" novalidate>
      <fieldset>
        <legend>Your Info</legend>
        <div class="field">
          <label for="sr-name">Name <span aria-hidden="true">*</span></label>
          <input id="sr-name" name="name" type="text" required autocomplete="name" />
        </div>
        <div class="field">
          <label for="sr-email">Email <span aria-hidden="true">*</span></label>
          <input id="sr-email" name="email" type="email" required autocomplete="email" />
        </div>
        <div class="field">
          <label for="sr-phone">Phone</label>
          <input id="sr-phone" name="phone" type="tel" autocomplete="tel" />
        </div>
      </fieldset>

      <fieldset>
        <legend>Services</legend>
        <div class="checkbox-group">
          <label><input type="checkbox" name="services[]" value="Photography"> Photography</label>
          <label><input type="checkbox" name="services[]" value="Videography"> Videography</label>
          <label><input type="checkbox" name="services[]" value="Editing"> Editing</label>
          <label><input type="checkbox" name="services[]" value="Other Services"> Other Services</label>
        </div>
        <div class="field">
          <label for="sr-location">Service Location (optional)</label>
          <input id="sr-location" name="service_location" type="text" placeholder="City/venue or address (if known)" />
        </div>
        <div class="field">
          <label for="sr-duration">Estimated Duration (optional)</label>
          <input id="sr-duration" name="duration" type="text" placeholder="e.g., 2 hours, half day, full day" />
        </div>
        <div class="field">
          <label for="sr-date">Target Date (optional)</label>
          <input id="sr-date" name="target_date" type="date" />
        </div>
      </fieldset>

      <fieldset>
        <legend>Details</legend>
        <div class="field">
          <label for="sr-message">Describe your project <span aria-hidden="true">*</span></label>
          <textarea id="sr-message" name="message" rows="6" required placeholder="What are you looking to accomplish? Any must-haves or timeline constraints?"></textarea>
        </div>
      </fieldset>

      <!-- Honeypot (anti-bot) -->
      <div style="position:absolute;left:-5000px" aria-hidden="true">
        <label for="sr-website">Leave blank</label>
        <input id="sr-website" name="website" type="text" tabindex="-1" autocomplete="off">
      </div>

      <button type="submit">Send Request</button>

      <p id="service-request-status" aria-live="polite" class="status"></p>
      <p id="service-request-fallback" hidden></p>
    </form>
  </main>

  <div id="footer-container"></div>
  <script>fetch('/footer.html').then(r=>r.text()).then(h=>{document.getElementById('footer-container').innerHTML=h})</script>

  <!-- No direct module include here. main.js should import & call initServiceRequestForm() -->
</body>
</html>
