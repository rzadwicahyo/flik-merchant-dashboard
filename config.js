/* FLIK Shipping prototype settings. This file is public: never put a secret key here.
 *
 * mode
 *   'mock'  example data built into the page (default; works on GitHub Pages and from a file)
 *   'api'   calls FLIK's API through the local server's /api proxy (`npm start` with FLIK_API_BASE
 *           and FLIK_API_KEY in .env). Anything the API doesn't answer falls back to example data.
 *
 * googleMapsKey
 *   Reserved for the Google Maps integration. The prototype always shows its built-in map
 *   preview. When it is wired up, use a browser key restricted to FLIK's domains (HTTP
 *   referrer) and to the Maps JavaScript and Geocoding APIs.
 */
window.FLIK_CONFIG = {
  mode: 'mock',
  apiBase: '/api',
  googleMapsKey: '',
  merchantId: 'MRC-0007'
};
