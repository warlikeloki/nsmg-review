// /js/main.js
import './modules/navigation.js';
import './modules/blog.js';
import './modules/blog-post.js';
import './modules/testimonials.js';
import './modules/equipment.js';
import './modules/contact.js';           // <— added Issue #47
import './modules/service-request.js';   // <— added Issue #47
import './modules/portfolio.js';
import './modules/admin.js';
import './modules/pricing.js';
import './modules/settings.js';
import './modules/other-services.js';   // <- NEW 
if (document.getElementById('homepage')) {
  import('./modules/homepage.js');   // <— added Issue NSM-23 NSM-22
}
import './modules/services-nav.js';    
import './modules/services-accordion.js';
