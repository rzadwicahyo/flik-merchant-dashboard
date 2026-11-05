/* ===== Studio: product photo → ready-to-post images (BUILD_SPEC section 3) =====
 * P0: page shells and routes. Lane A fills them in (S1 public page, S2 designing and composer,
 * S3 editor, S4 sign-up, S5 export and payment, S6 dashboard Studio).
 */
function renderStudio(){const el=document.getElementById('view-stu');
  el.innerHTML=`<div class="ph"><div><h1>${geT('studio.h')}</h1><p class="sec-sub ge-sub">${geT('studio.sub')}</p></div><a class="btn btn-p" href="#studio/edit">${ic('studio',15)}${geT('studio.open')}</a></div>
  ${geSoon([['S6',GS.account==='lead'?'Your designs, plus a card that opens your free competitor snapshot':'Your designs with re-download, your saved logo and brand colour, and “Use in a campaign”'],['S3','The editor: scene, text, format, brand and cut-out'],['S5','Export: PNG, cut-out PNG, SVG, PSD; free quota, then balance or payment link']])}`}
GX.studio=g=>({html:`<div class="gx-in st-pub"><h1>${geT('studio.pub.h')}</h1><p class="vf-lead">${geT('studio.pub.sub')}</p>
  ${geSoon([['S1','Upload a photo or try one of 8 samples; category, vibe, product name, logo'],['S2','Four watermarked previews in under 10 seconds'],['S4','Sign up only when you download: name, brand, WhatsApp code, category']])}
  <p class="gx-foot">${geT('gx.by')}</p></div>`});
GX.edit=g=>({title:geT('studio.edit.h'),html:`<div class="gx-in">${geSoon([['S2','Designing progress and the 4 previews, with the FLIK watermark drawn in'],['S3','Scene, text, format, brand and cut-out tabs; “Show me 4 more” within the limit'],['S4','Download or Use opens sign-up for strangers'],['S5','Export and payment']])}</div>`});
