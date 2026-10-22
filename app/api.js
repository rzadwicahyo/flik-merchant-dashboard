/* ===== FLIK API adapter =====
 * Every screen asks for data through FLIK.api. In 'mock' mode (the default) each call answers
 * from the example data in app/data.js. In 'api' mode it calls FLIK's API through the local
 * server's /api proxy, which adds the secret key server-side, and falls back to the example
 * data if the call fails. Endpoints and payloads are listed in docs/API.md.
 */
window.FLIK = window.FLIK || {};
(function(){
  const cfg = Object.assign({mode:'mock', apiBase:'/api', googleMapsKey:'', merchantId:'MRC-0007'}, window.FLIK_CONFIG || {});
  const mocks = {};
  const log = [];
  async function call(name, method, path, body){
    const t0 = performance.now();
    if (cfg.mode === 'api') {
      try {
        const r = await fetch(cfg.apiBase + path, {method, headers:{'content-type':'application/json','x-merchant-id':cfg.merchantId}, body: body ? JSON.stringify(body) : undefined});
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const data = await r.json();
        log.unshift({name, method, path, source:'api', ms:Math.round(performance.now()-t0)});
        return data;
      } catch (e) { log.unshift({name, method, path, source:'example data (API failed: '+e.message+')'}); }
    } else log.unshift({name, method, path, source:'example data'});
    if (!mocks[name]) throw new Error('No example data for ' + name);
    return mocks[name](body);
  }
  FLIK.config = cfg;
  FLIK.apiLog = log;
  /* data.js registers the example answers here */
  FLIK.mock = (name, fn) => { mocks[name] = fn; };
  FLIK.api = {
    merchant:        ()      => call('merchant', 'GET', '/v1/merchant'),
    pickupAddresses: ()      => call('pickupAddresses', 'GET', '/v1/shipping/pickup-addresses'),
    rates:           (q)     => call('rates', 'POST', '/v1/shipping/rates', q),
    recommend:       (q)     => call('recommend', 'POST', '/v1/shipping/recommendations', q),
    shopperScore:    (q)     => call('shopperScore', 'POST', '/v1/shipping/shopper-score', q),
    validateRows:    (q)     => call('validateRows', 'POST', '/v1/shipping/bulk/validate', q),
    createShipments: (q)     => call('createShipments', 'POST', '/v1/shipping/shipments', q),
    shipments:       (q)     => call('shipments', 'GET', '/v1/shipping/shipments' + (q ? '?' + new URLSearchParams(q) : '')),
    tracking:        (awbs)  => call('tracking', 'GET', '/v1/shipping/tracking?awb=' + encodeURIComponent(awbs.join(','))),
    createTicket:    (q)     => call('createTicket', 'POST', '/v1/support/tickets', q),
    geocode:         (q)     => call('geocode', 'POST', '/v1/maps/geocode', q)
  };
})();
