<?php
// /contact_form.php
?><!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>Contact Us | Neil Smith Media Group</title>
  <meta name="description" content="Get in touch with Neil Smith Media Group for photography, videography, editing, and other services." />
  <link rel="stylesheet" href="/css/base.css">
  <link rel="stylesheet" href="/css/forms.css">
</head>
<body>
  <div id="header-container"></div>
  <script>fetch('/header.html').then(r=>r.text()).then(h=>{document.getElementById('header-container').innerHTML=h})</script>

  <main class="container">
    <h1>Contact Us</h1>
    <p>Questions, ideas, or project inquiries? We’d love to hear from you.</p>

    <form id="contact-form" class="form-grid" method="post" action="/php/submit_contact.php" novalidate>
      <fieldset>
        <legend>Your Info</legend>
        <div class="field">
          <label for="ct-name">Name <span aria-hidden="true">*</span></label>
          <input id="ct-name" name="name" type="text" required autocomplete="name" />
        </div>
        <div class="field">
          <label for="ct-email">Email <span aria-hidden="true">*</span></label>
          <input id="ct-email" name="email" type="email" required autocomplete="email" />
        </div>
        <div class="field">
          <label for="ct-phone">Phone</label>
          <input id="ct-phone" name="phone" type="tel" autocomplete="tel" />
        </div>
      </fieldset>

      <fieldset>
        <legend>Topic</legend>
        <div class="field">
          <label for="ct-about">What’s this about?</label>
          <select id="ct-about" name="about">
            <option>General</option>
            <option>Photography</option>
            <option>Videography</option>
            <option>Editing</option>
            <option>Other Services</option>
          </select>
        </div>
      </fieldset>

      <fieldset>
        <legend>Message</legend>
        <div class="field">
          <label for="ct-message">Your Message <span aria-hidden="true">*</span></label>
          <textarea id="ct-message" name="message" rows="6" required placeholder="Tell us a bit about what you need."></textarea>
        </div>
      </fieldset>

      <!-- Honeypot (anti-bot) -->
      <div style="position:absolute;left:-5000px" aria-hidden="true">
        <label for="ct-website">Leave blank</label>
        <input id="ct-website" name="website" type="text" tabindex="-1" autocomplete="off">
      </div>

      <button type="submit">Send Message</button>

      <p id="contact-status" aria-live="polite" class="status"></p>
      <p id="contact-fallback" hidden></p>
    </form>
  </main>

  <div id="footer-container"></div>
  <script>fetch('/footer.html').then(r=>r.text()).then(h=>{document.getElementById('footer-container').innerHTML=h})</script>

  <!-- No direct module include here. main.js should import & call initContactForm() -->
</body>
</html>
