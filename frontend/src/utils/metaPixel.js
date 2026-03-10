import ReactPixel from 'react-facebook-pixel';

const PIXEL_ID = '1462994898219509';

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
 * @param {Object} event - Event object with title, _id, price
 */
export const trackViewContent = (event) => {
  try {
    ReactPixel.track('ViewContent', {
      content_name: event.title,
      content_ids: [event._id],
      content_type: 'event',
      value: event.price?.amount || 0,
      currency: 'INR',
    });
    console.log('📊 Meta Pixel: ViewContent -', event.title);
  } catch (error) {
    console.error('❌ Meta Pixel ViewContent error:', error);
  }
};

/**
 * Track when user initiates checkout
 * @param {Object} data - Checkout data
 */
export const trackInitiateCheckout = (data) => {
  try {
    ReactPixel.track('InitiateCheckout', {
      content_ids: [data.eventId],
      content_type: 'event',
      value: data.amount,
      currency: 'INR',
      num_items: data.quantity || 1,
    });
    console.log('📊 Meta Pixel: InitiateCheckout -', data.amount);
  } catch (error) {
    console.error('❌ Meta Pixel InitiateCheckout error:', error);
  }
};

/**
 * Track purchase (payment success)
 * @param {Object} data - Purchase data
 */
export const trackPurchase = (data) => {
  try {
    ReactPixel.track('Purchase', {
      content_ids: [data.eventId],
      content_type: 'event',
      value: data.amount,
      currency: 'INR',
      num_items: data.quantity || 1,
    }, {
      eventID: data.orderId // For deduplication with server-side event
    });
    console.log('📊 Meta Pixel: Purchase -', data.amount);
  } catch (error) {
    console.error('❌ Meta Pixel Purchase error:', error);
  }
};
