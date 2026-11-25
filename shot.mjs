import puppeteer from 'puppeteer-core';
const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox']});
const p=await b.newPage();
await p.setViewport({width:1200,height:630});
await p.setContent(`<body style="margin:0;width:1200px;height:630px;background:linear-gradient(135deg,#0a1a3f,#0b2a6f);color:#fff;font-family:'Noto Sans Arabic','DejaVu Sans',sans-serif;display:flex;flex-direction:column;justify-content:center;align-items:center;direction:rtl"><div style="font-size:150px;font-weight:800;color:#3b9bff">عُدّة</div><div style="font-size:46px;margin-top:10px">كل اللي تحتاجه، في مكان واحد.</div><div style="font-size:30px;margin-top:30px;opacity:.7">3EDDA · أدوات عربية مجانية</div></body>`);
await p.screenshot({path:'src/og.png'});
await p.setViewport({width:1280,height:900});
for(const [n,u,w] of [['home','/',1280],['tool','/tools/percentage-calculator/',1280],['mob','/',390]]){}
await b.close();
