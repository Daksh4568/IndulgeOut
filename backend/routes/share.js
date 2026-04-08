const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const mongoose = require('mongoose');

// Helper: find event by ID or slug (same logic as events.js)
async function findEventByIdOrSlug(identifier) {
  if (mongoose.Types.ObjectId.isValid(identifier) && identifier.match(/^[0-9a-fA-F]{24}$/)) {
    return Event.findById(identifier).select('title slug description date location images price currentEffectivePrice').lean();
  }
  return Event.findOne({ slug: identifier }).select('title slug description date location images price currentEffectivePrice').lean();
}

// Derive the frontend origin from the incoming request (works when proxied through Amplify)
function getFrontendUrl(req) {
  // When Amplify proxies the request, the original host header is preserved
  const host = req.get('X-Forwarded-Host') || req.get('host') || '';
  const proto = req.get('X-Forwarded-Proto') || req.protocol || 'https';
  if (host.includes('indulgeout.com')) {
    return `${proto}://${host}`;
  }
  return process.env.FRONTEND_URL || 'https://www.indulgeout.com';
}

// GET /share/events/:slugOrId — serves OG meta tags for social crawlers, redirects real users
router.get('/events/:slugOrId', async (req, res) => {
  try {
    const event = await findEventByIdOrSlug(req.params.slugOrId);

    if (!event) {
      // Fallback: redirect to homepage
      const frontendUrl = getFrontendUrl(req);
      return res.redirect(302, frontendUrl);
    }

    const frontendUrl = getFrontendUrl(req);
    const eventSlug = event.slug || event._id;
    const canonicalUrl = `${frontendUrl}/events/${eventSlug}`;

    const title = event.title || 'Event on IndulgeOut';
    const description = event.description
      ? event.description.replace(/<[^>]*>/g, '').substring(0, 200)
      : 'Discover unique offline experiences on IndulgeOut';
    const locationText = event.location?.address || event.location?.city || '';
    const dateStr = event.date
      ? new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : '';
    const price = (event.currentEffectivePrice ?? event.price?.amount) > 0
      ? `₹${event.currentEffectivePrice ?? event.price.amount}`
      : 'FREE';

    const ogDescription = [dateStr, locationText, price].filter(Boolean).join(' • ') + (description ? ` — ${description}` : '');

    // Use event image if available; mark it as large image for proper preview
    const hasEventImage = event.images && event.images.length > 0 && event.images[0];
    const image = hasEventImage ? event.images[0] : `${frontendUrl}/images/LogoOrbit.jpg`;

    // Return minimal HTML with OG tags + instant redirect for real browsers
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(title)} — IndulgeOut</title>
<meta property="og:type" content="website"/>
<meta property="og:title" content="${escapeHtml(title)}"/>
<meta property="og:description" content="${escapeHtml(ogDescription)}"/>
<meta property="og:image" content="${escapeHtml(image)}"/>
${hasEventImage ? '<meta property="og:image:width" content="1200"/>\n<meta property="og:image:height" content="630"/>' : ''}
<meta property="og:url" content="${escapeHtml(canonicalUrl)}"/>
<meta property="og:site_name" content="IndulgeOut"/>
<meta name="twitter:card" content="${hasEventImage ? 'summary_large_image' : 'summary'}"/>
<meta name="twitter:title" content="${escapeHtml(title)}"/>
<meta name="twitter:description" content="${escapeHtml(ogDescription)}"/>
<meta name="twitter:image" content="${escapeHtml(image)}"/>
<meta http-equiv="refresh" content="0;url=${escapeHtml(canonicalUrl)}"/>
<link rel="canonical" href="${escapeHtml(canonicalUrl)}"/>
</head>
<body>
<script>window.location.replace(${JSON.stringify(canonicalUrl)});</script>
<p>Redirecting to <a href="${escapeHtml(canonicalUrl)}">${escapeHtml(title)}</a>…</p>
</body>
</html>`);
  } catch (error) {
    console.error('Share OG route error:', error);
    const frontendUrl = getFrontendUrl(req);
    res.redirect(302, frontendUrl);
  }
});

// Escape HTML entities to prevent XSS in the generated page
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = router;
