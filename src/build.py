import base64,os,json
D=os.environ.get('DS','../flik-design-system')+'/dashboard/index.html'
LOGODIR=os.environ.get('DS','../flik-design-system')+'/assets/Logos/courier'
src=open(D).read()
css=open('add.css').read(); js=open('add.js').read()+'\n'+open('add2.js').read()
def rep(a,b):
    global src
    assert a in src, 'MISSING: '+a[:90]
    src=src.replace(a,b,1)

# --- courier logos: the live host is blocked inside artifacts, so the PNGs are embedded ---
KEYS={'anteraja':'anteraja','sicepat':'sicepat','lion':'lionparcel','jne':'jne','ninja':'ninjaxpress','spx':'spx','jnt':'jnt',
      'gosend':'gosend','idexpress':'idexpress','lalamove':'lalamove','mrspeedy':'mrspeedy','paxel':'paxel','rpx':'rpx','sap':'sap','tiki':'tiki',
      'deliveree':'deliveree','grab':'grabexpress','wahana':'wahana'}
logo={}
for k,f in KEYS.items():
    b=open(os.path.join(LOGODIR,f+'.png'),'rb').read()
    logo[k]='data:image/png;base64,'+base64.b64encode(b).decode()

rep('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>FLIK Dashboard</title>','<title>FLIK Shipping Prototype</title>')
rep('family=Inter:wght@400;500;600&display=swap','family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap')
rep('</style>\n</head>\n<body>','\n'+css+'</style>')
rep('</script>\n</body>\n</html>','</script>\n<script>\n'+js+'\n</script>')

# real courier logos, embedded
old_logo=[l for l in src.split('\n') if l.startswith('const LOGO=')][0]
rep(old_logo,'const LOGO='+json.dumps(logo)+';')

# the router runs once my overrides are in place
rep("document.getElementById('baladd').onclick=topupModal;\nshow(hashView());","document.getElementById('baladd').onclick=topupModal;")

# create-shipment flow: my own footer handler (bulk, verification gate, batch split)
rep("if(t.id==='sx-next'&&!t.disabled){if(X.step<4){X.step++;drawSx();sxBody.scrollTop=0;return}",
    "if(t.id==='sx-next'&&!t.disabled){if(sxNext())return;")
rep("""    const c=costs(),sv=SERVICES[X.svc],id=bid(),cod=X.pay==='cod'?X.ships.length:0;
    SHP.unshift({id,st:'ready',svc:sv,n:X.ships.length,cod,codv:c.codTot,cost:c.ship,wh:WAREHOUSES[X.wh],created:new Date(NOW.getTime()+60000*SHP.length)});
    X.done={id,n:X.ships.length,courier:COURIERS.find(x=>x.k===sv[0]).n,when:pickupTx().replace(' · ',', ')};stab='all';drawSx();sxBody.scrollTop=0}});""",
    """    const c=costs(),sv=SERVICES[X.svc],id=bid();addCreated(c,sv,'ready');
    X.done={id,n:X.ships.length,courier:COURIERS.find(x=>x.k===sv[0]).n,when:pickupTx().replace(' · ',', ')};drawSx();sxBody.scrollTop=0}});""")

# verification gates where money moves
rep("go.onclick=()=>{modal.innerHTML=","go.onclick=()=>{if(!PS.verified){verifyGate('top_up',topupModal);return}modal.innerHTML=")
rep("document.getElementById('ie-review').onclick=()=>{","document.getElementById('ie-review').onclick=()=>{if(!PS.verified){verifyGate('create_invoice',()=>document.getElementById('ie-review').click());return}")
rep('<div class="side-foot">FLIK Dashboard · Prototype</div>','<div class="side-foot">FLIK Shipping · Phase 1 prototype · example data</div>')

HEAD='<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta name="robots" content="noindex">\n</head>\n<body>\n'
open('../index.html','w').write(HEAD+src+'\n</body>\n</html>\n')
print('built ../index.html')
