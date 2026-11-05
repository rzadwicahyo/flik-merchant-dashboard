/* ===== Competitor monitoring (BUILD_SPEC section 4) =====
 * Instagram and the competitor's own Shopify or WooCommerce site only. No marketplaces, no TikTok.
 * P0: page shell. Lane B fills it in (B1 lead snapshot, B2 merchant tracking, B3 states and ideas).
 */
function renderCompete(){const el=document.getElementById('view-cmp'),lead=GS.account==='lead';
  el.innerHTML=`<div class="ph"><div><h1>${geT('cmp.h')}</h1><p class="sec-sub ge-sub">${lead?geT('cmp.lead.sub'):geT('cmp.sub')}</p></div></div>
  ${geSoon(lead?[['B1','One competitor\'s Instagram, once: profile, last 9 posts, promos, posting times, themes'],['B1','“Become a FLIK merchant” for weekly tracking of 3 competitors']]
    :[['B2',`Up to ${limitCap('competitors')} competitors, Instagram + website, refreshed weekly`],['B2','Posts, products and prices, and an activity timeline'],['B3','Friendly states when a source can\'t be read, and “Get an idea” from any change']])}`}
