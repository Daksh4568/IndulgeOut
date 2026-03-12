import ReactPixel from 'react-facebook-pixel';

const PIXEL_ID = '1462994898219509';

/**
 * Get Facebook Click ID (fbc) from cookie
 */
const getFbc = () => {
  const match = document.cookie.match(/_fbc=([^;]+)/);
  return match ? match[1] : null;
};

/**
 * Get Facebook Browser ID (fbp) from cookie
 */
const getFbp = () => {
  const match = document.cookie.match(/_fbp=([^;]+)/);
  return match ? match[1] : null;
};

/**
 * Initialize Meta Pixel
 * Call this once when app loads
 */
export const initPixel = () => {
  try {
    ReactPixel.init(PIXEL_ID, {}, { autoConfig: true, debug: false });
    console.log('✅ Meta Pixel initialized');
  } catch (error) {
    console.error('❌ Meta Pixel init error:', error);
  }
};

/**
 * Track page view
 */
export const trackPageView = () => {
  try {
    ReactPixel.pageView();
    console.log('📊 Meta Pixel: PageView');
  } catch (error) {
    console.error('❌ Meta Pixel PageView error:', error);
  }
};

/**
 * Track when user views an event
 * @param {Object} event - Event object with title, _id, price, categories, location
 */
export const trackViewContent = (event) => {
  try {
    ReactPixel.track('ViewContent', {
      content_name: event.title,
      content_ids: [event._id],
      content_category: event.categories?.[0] || 'Events', // Primary category
      content_type: 'event',
      value: event.price?.amount || 0,
      currency: 'INR',
      // Add custom parameters for Meta reporting
      event_city: event.location?.city || 'Unknown',
      event_date: event.date,
    });
    console.log('📊 Meta Pixel: ViewContent -', event.title, `[${event.location?.city}]`);
  } catch (error) {
    console.error('❌ Meta Pixel ViewContent error:', error);
  }
};

/**
 * Track when user initiates checkout
 * @param {Object} data - Checkout data with eventId, amount, quantity, category, city, date
 */
export const trackInitiateCheckout = (data) => {
  try {
    ReactPixel.track('InitiateCheckout', {
      content_ids: [data.eventId],
      content_type: 'event',
      value: data.amount,
      currency: 'INR',
      num_items: data.quantity || 1,
      content_category: data.category || 'Events',
      event_city: data.city || 'Unknown',
      event_date: data.date,
    });
    console.log('📊 Meta Pixel: InitiateCheckout -', data.amount, `[${data.city || 'Unknown'}]`);
  } catch (error) {
    console.error('❌ Meta Pixel InitiateCheckout error:', error);
  }
};

/**
 * Track purchase (payment success)
 * @param {Object} data - Purchase data with eventId, amount, quantity, orderId, userId, phone, email, category, city, date
 */
export const trackPurchase = (data) => {
  try {
    const eventData = {
      content_ids: [data.eventId],
      content_type: 'event',
      content_name: data.eventName || 'Event Ticket',
      value: data.amount,
      currency: 'INR',
      num_items: data.quantity || 1,
      content_category: data.category || 'Events',
      event_city: data.city || 'Unknown',
      event_date: data.date,
    };

    const advancedMatching = {};
    
    // Add user data for better matching
    if (data.email) advancedMatching.em = data.email;
    if (data.phone) advancedMatching.ph = data.phone;
    if (data.userId) advancedMatching.external_id = data.userId;
    
    // Add Facebook parameters
    const fbp = getFbp();
    const fbc = getFbc();
    if (fbp) advancedMatching.fbp = fbp;
    if (fbc) advancedMatching.fbc = fbc;

    ReactPixel.track('Purchase', eventData, {
      eventID: data.orderId, // For deduplication with server-side event
      ...advancedMatching
    });
    
    console.log('📊 Meta Pixel: Purchase -', data.amount, `[${data.city || 'Unknown'}]`, 'Match params:', Object.keys(advancedMatching).length);
  } catch (error) {
    console.error('❌ Meta Pixel Purchase error:', error);
  }
};
