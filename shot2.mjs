import puppeteer from 'puppeteer-core';import http from 'http';import fs from 'fs';import path from 'path';
const DIST=path.resolve('dist');
const srv=http.createServer((q,r)=>{let f=path.join(DIST,decodeURIComponent(q.url.split('?')[0]));if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');const e=path.extname(f);r.setHeader('content-type',{'.html':'text/html;charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml'}[e]||'text/plain');r.end(fs.readFileSync(f))}).listen(8124);
const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox']});
const p=await b.newPage();
for(const [n,u,w,dark] of [['home','/',1280,0],['homed','/',1280,1],['tool','/tools/percentage-calculator/',1280,0],['mob','/',390,0]]){
 await p.setViewport({width:w,height:900});await p.goto('http://localhost:8124'+u);
 await p.evaluate(d=>{document.documentElement.setAttribute('data-theme',d?'dark':'light')},dark);
 await new Promise(r=>setTimeout(r,300));await p.screenshot({path:`/tmp/s-${n}.png`});}
await b.close();srv.close();
