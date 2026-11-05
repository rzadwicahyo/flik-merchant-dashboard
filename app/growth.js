/* ===== Marketing › Growth Engine v2 (BUILD_SPEC section 5). Replaces v3.12 (app/crm.js). =====
 * Ideas (post or campaign) from competitors, the store and big dates → review → adjust → execute →
 * track against the holdout. P0: page shells and routes. Lane C fills them in (C1 to C5).
 */
function renderGrowth(){const el=document.getElementById('view-gro'),g=GS.route||{};
  if(GS.account==='lead'){el.innerHTML=`<h1>${geT('gro.h')}</h1><section class="card w-empty"><span class="qic">${ic('rocket',22,1.6)}</span><div><b>${geT('gro.lead.h')}</b><span>${geT('gro.lead.sub')}</span></div><button class="btn btn-p" data-gelead>${geT('gro.lead.cta')}</button></section>`;
    el.querySelector('[data-gelead]').onclick=()=>{track('merchant_cta_clicked',{from:'growth'});toast('Opens FLIK merchant sign-up')};return}
  if(g.sub==='campaign'){el.innerHTML=`<div class="ph"><div><h1>${geT('gro.camp.h')}</h1><p class="sec-sub ge-sub"><a href="#marketing/growth">${geT('gro.h')}</a> › ${esc(g.id)}</p></div></div>
    ${geSoon([['C4','Funnel, voucher redemptions, sales against the holdout, cost and return, by channel'],['C4','CSV download while it runs; the owner\'s WhatsApp report when it ends']])}`;return}
  el.innerHTML=`<div class="ph"><div><h1>${geT('gro.h')}</h1><p class="sec-sub ge-sub">${geT('gro.sub')}</p></div></div>
  ${geSoon([['C1',GS.account==='new'?'A shorter list for new merchants: big dates and competitors first':'Ideas for this week: big date, competitor move, your store'],['C2','Review and adjust: channels, voucher, Studio image, WhatsApp template, own context, holdout'],['C3','Execute: pay WhatsApp sends from the balance or a payment link; post kit and offline poster'],['C4','Campaigns and results'],['C5','Claim page, cashier redemption and settings']])}`}
GX.idea=g=>({title:geT('gro.idea.h'),html:`<div class="gx-in">${geSoon([['C2','1 Review · 2 Adjust: why this idea, audience, channels, voucher, creative, WhatsApp template, holdout'],['C3','3 Execute: summary, cost, payment, then the campaign starts']])}</div>`});
GX.claim=g=>({html:`<div class="gx-in st-pub"><h1>${geT('claim.h')}</h1>${geSoon([['C5','Store logo and offer, WhatsApp number and consent, “Save voucher”, then show your number at the cashier']])}</div>`});
