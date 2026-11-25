import puppeteer from 'puppeteer-core';import http from 'http';import fs from 'fs';import path from 'path';
const DIST=path.resolve('dist');
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);let f=path.join(DIST,p);if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');if(!fs.existsSync(f)){r.statusCode=404;f=path.join(DIST,'404.html')}const ext=path.extname(f);r.setHeader('content-type',{'.html':'text/html;charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.xml':'application/xml','.png':'image/png'}[ext]||'text/plain');r.end(fs.readFileSync(f))}).listen(8123);
const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox']});
const toolsDirs=fs.readdirSync(DIST+'/tools').filter(d=>fs.existsSync(`${DIST}/tools/${d}/index.html`));
const only=process.argv[2];
const problems=[];
for(const id of toolsDirs){if(only&&id!==only)continue;
 const pg=await b.newPage();await pg.setViewport({width:420,height:900});
 const errs=[];pg.on('pageerror',e=>errs.push('pageerror: '+e.message));pg.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text())});pg.on('dialog',d=>d.accept());
 await pg.goto(`http://localhost:8123/tools/${id}/`,{waitUntil:'load'});
 await new Promise(r=>setTimeout(r,200));
 const info=await pg.evaluate(()=>({hasForm:!!document.querySelector('#runBtn'),ex:!!document.querySelector('#exBtn'),files:[...document.querySelectorAll('input[type=file]')].map(f=>f.id),mount:document.querySelector('#toolRoot').children.length}));
 let status='ok';
 try{
  if(info.files.length){
   const fi=await pg.$('input[type=file]');const accept=await pg.evaluate(e=>e.accept,fi);
   const f=accept.includes('webp')&&!accept.includes('image/*')?'/tmp/t.webp':accept.includes('png')&&!accept.includes('image/*')?'/tmp/t.png':'/tmp/t.jpg';
   if(id==='image-merge')await fi.uploadFile('/tmp/t.jpg','/tmp/t.png');else await fi.uploadFile(f);
   if(id==='image-resizer'||id==='image-dimensions-changer'||id==='social-image-sizes'){if(id==='image-dimensions-changer'){await pg.type('#f-w','300');await pg.type('#f-h','300')}}
   await pg.click('#runBtn');await pg.waitForFunction(()=>{const r=document.querySelector('#res');return r&&r.classList.contains('show')&&!/جارٍ/.test(r.textContent)},{timeout:15000});
  }else if(info.ex){await pg.click('#exBtn');await new Promise(r=>setTimeout(r,id==='currency-converter'?3000:500))}
  else if(info.hasForm){await pg.click('#runBtn');await new Promise(r=>setTimeout(r,300))}
  const res=await pg.evaluate(()=>{const r=document.querySelector('#res');return r?{show:r.classList.contains('show'),err:!!r.querySelector('.err'),txt:r.innerText.slice(0,120)}:null});
  if(info.hasForm){if(!res||!res.show)status='NO RESULT';else if(res.err)status='ERR: '+res.txt}
 }catch(e){status='EXC '+e.message}
 if(errs.length||status!=='ok'){problems.push([id,status,errs.join(' | ')])}
 await pg.close();
}
console.log(JSON.stringify(problems,null,1));console.log('tested',toolsDirs.length);
await b.close();srv.close();
