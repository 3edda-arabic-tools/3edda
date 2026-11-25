import fs from 'fs';import path from 'path';import vm from 'vm';
const ROOT=path.resolve('.');const SRC=ROOT+'/src';const OUT=ROOT+'/dist';
const SITE=(process.env.SITE_URL||'https://3edda.pages.dev').replace(/\/$/,'');
const BASE=process.env.BASE_PATH||''; // e.g. /3edda for github pages project sites
const REPO=process.env.REPO_URL||'';
const TODAY=new Date().toISOString().slice(0,10);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const CATS=[
 {id:'calc',slug:'calculators',name:'أدوات الحسابات',icon:'calc',file:'calc',desc:'حاسبات مجانية للنسبة المئوية والخصم والأقساط والادخار والضريبة وتحويل العملات.',intro:'تجمع هذه الصفحة الحاسبات التي تحتاجها في حياتك اليومية: من حساب النسبة المئوية والخصم، إلى الأقساط والادخار والضريبة وتحويل العملات. كل أداة تعمل داخل متصفحك مباشرة وتعرض لك النتيجة مع خطوات واضحة.'},
 {id:'text',slug:'text-tools',name:'أدوات النصوص',icon:'text',file:'text',desc:'أدوات نصوص مجانية: عدّاد الكلمات والحروف، تنظيف النص، الترتيب، الاستخراج، والمقارنة.',intro:'أدوات سريعة لمعالجة النصوص العربية والإنجليزية: عدّ الكلمات والحروف، تنظيف المسافات والأسطر، ترتيب القوائم، استخراج الأرقام والروابط، ومقارنة نصين. لا يُرسَل نصك إلى أي خادم، فالمعالجة تتم على جهازك.'},
 {id:'image',slug:'image-tools',name:'أدوات الصور',icon:'image',file:'image',desc:'ضغط الصور وتغيير حجمها وتحويل صيغها وقصها وتدويرها وإضافة علامة مائية دون رفعها إلى أي خادم.',intro:'ضغط وتحويل وتعديل الصور بسهولة. تتم معالجة الصور بالكامل على جهازك داخل المتصفح، فلا تُرفع صورك إلى أي خادم ولا يتم تخزينها.'},
 {id:'misc',slug:'misc-tools',name:'أدوات متنوعة',icon:'misc',file:'misc',desc:'أدوات يومية متنوعة: رمز QR، مولد كلمات المرور، محولات الوحدات، المؤقت، حساب العمر والتواريخ، وقائمة المهام.',intro:'مجموعة أدوات يومية لا غنى عنها: إنشاء رمز QR، توليد كلمات مرور قوية، تحويل الوحدات، المؤقت والساعة، حساب العمر والفروق بين التواريخ، وقائمة مهام وملاحظات تُحفظ على جهازك.'},
 {id:'biz',slug:'business-tools',name:'أدوات التجارة والمشروعات',icon:'biz',file:'biz',desc:'أدوات للتجار وأصحاب المشاريع: سعر البيع، هامش الربح، الشحن، نقطة التعادل، الفواتير وعروض الأسعار.',intro:'أدوات عملية للتجار وأصحاب المشاريع الصغيرة: تسعير المنتجات، حساب هامش الربح والمكسب، تكلفة الشحن والعمولات، نقطة التعادل، وإنشاء الفواتير وعروض الأسعار وقوائم الأسعار وتصديرها.'},
 {id:'write',slug:'writing-assistant',name:'مساعد الكتابة',icon:'write',file:'write',desc:'مولدات نصوص تعتمد على قوالب وقواعد: منشورات، أوصاف منتجات، عناوين، أسماء براندات، رسائل، وهاشتاجات.',intro:'أدوات تساعدك على بدء الكتابة بسرعة: منشورات، أوصاف منتجات، عناوين، رسائل، أفكار وهاشتاجات. تنبيه صريح: هذه الأدوات تعمل بقوالب وقواعد توليد واختيارات منك، وليست ذكاءً اصطناعيًا حقيقيًا، لذلك راجع النص وعدّله قبل استخدامه.'}
];
const CAT=Object.fromEntries(CATS.map(c=>[c.id,c]));
/* load tools */
const tools=[];
for(const c of CATS){
 const code=fs.readFileSync(`${SRC}/js/t-${c.file}.js`,'utf8');
 const reg={};const sandbox={window:{},document:undefined,navigator:{},localStorage:{},console};sandbox.window.EDDA={tools:reg};sandbox.EDDA=sandbox.window.EDDA;
 vm.runInNewContext(code,sandbox,{filename:`t-${c.file}.js`});
 for(const id of Object.keys(reg)){const t=reg[id];t.cat=t.cat||c.id;t.file=c.file;tools.push(t)}
}
const ids=new Set();for(const t of tools){if(ids.has(t.id))throw new Error('dup '+t.id);ids.add(t.id)}
const url=p=>`${SITE}${BASE}/${p}`;
const toolPath=t=>`tools/${t.id}/`;
const depthRoot=d=>d===0?'./':'../'.repeat(d);
const ICONS={calc:'<rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M8.5 7h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01"/>',text:'<path d="M4 6h16M4 12h10M4 18h14"/>',image:'<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 8"/>',misc:'<rect x="3" y="3" width="7.5" height="7.5" rx="1.8"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.8"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.8"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.8"/>',biz:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',write:'<path d="M4 20l1-4L16.5 4.5a2 2 0 0 1 3 3L8 19z"/><path d="M14 7l3 3"/>',star:'<path d="M12 3l2.8 6 6.7.8-5 4.5 1.4 6.7L12 17.6 6.1 21l1.4-6.7-5-4.5L9.2 9z"/>',search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',moon:'<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',copy:'<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',share:'<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/>',menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',lock:'<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',phone:'<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>'};
const sprite=`<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">${Object.entries(ICONS).map(([k,v])=>`<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`).join('')}</svg>`;
const ico=n=>`<svg class="ico" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const toolUrlRel=t=>toolPath(t);
function head({title,desc,canon,depth,og='website',noindex=false,ld=[],extraJs=[]}){
 const r=depthRoot(depth);
 return `<!doctype html><html lang="ar" dir="rtl" data-root="${r}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}">${noindex?'<meta name="robots" content="noindex,follow">':'<meta name="robots" content="index,follow,max-image-preview:large">'}<link rel="canonical" href="${canon}"><meta name="theme-color" content="#0b1b3b"><meta property="og:type" content="${og}"><meta property="og:site_name" content="عُدّة | 3EDDA"><meta property="og:locale" content="ar_AR"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${canon}"><meta property="og:image" content="${url('assets/og.png')}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><link rel="icon" type="image/svg+xml" href="${r}assets/favicon.svg"><link rel="stylesheet" href="${r}assets/style.css?v=${BUILD}"><script>try{var t=localStorage.getItem('edda.theme');t=t?JSON.parse(t):(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','light')}</script>${ld.map(o=>`<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('')}</head>`;
}
const BUILD=Date.now().toString(36);
function header(depth,active){
 const r=depthRoot(depth);
 return `<body data-page="@PAGE@" @ATTR@>${sprite}<a href="#main" class="hide" style="position:absolute">تخطّي إلى المحتوى</a><header class="top"><div class="wrap bar"><a class="logo" href="${r}" aria-label="عُدّة - الرئيسية"><span class="mark">ع</span><span>عُدّة <small>3EDDA</small></span></a><nav class="main" id="mainNav" aria-label="التنقل الرئيسي"><a href="${r}"${active==='home'?' class="on"':''}>الرئيسية</a><a href="${r}tools/"${active==='all'?' class="on"':''}>كل الأدوات</a>${CATS.map(c=>`<a href="${r}${c.slug}/"${active===c.id?' class="on"':''}>${c.name}</a>`).join('')}</nav><span class="sp"></span><form class="sbox" data-search role="search" action="${r}search/"><input type="search" name="q" placeholder="ابحث عن أداة…" aria-label="ابحث عن أداة" autocomplete="off">${ico('search')}</form><button class="iconbtn" id="themeBtn" aria-label="تبديل الوضع" type="button"></button><button class="iconbtn menubtn" id="menuBtn" aria-label="القائمة" aria-expanded="false" type="button">${ico('menu')}</button></div></header>`;
}
function footer(depth){
 const r=depthRoot(depth);
 return `<footer class="foot"><div class="wrap"><div class="cols"><div><h4>عُدّة | 3EDDA</h4><p style="margin:0;font-size:.9rem">كل اللي تحتاجه، في مكان واحد.<br>أدوات مجانية بالكامل، بدون تسجيل، وتعمل على جهازك.</p></div><div><h4>الأقسام</h4>${CATS.map(c=>`<a href="${r}${c.slug}/">${c.name}</a>`).join('')}</div><div><h4>الموقع</h4><a href="${r}tools/">كل الأدوات</a><a href="${r}about/">من نحن</a><a href="${r}contact/">اتصل بنا</a></div><div><h4>معلومات قانونية</h4><a href="${r}privacy/">سياسة الخصوصية</a><a href="${r}terms/">شروط الاستخدام</a><a href="${r}disclaimer/">إخلاء المسؤولية</a></div></div><div class="cp">© ${new Date().getFullYear()} عُدّة. جميع الأدوات مجانية، ولا نجمع بياناتك الشخصية.</div></div></footer>`;
}
const ADS=(slot)=>`<div class="ad-slot" data-ad-slot="${slot}" hidden aria-hidden="true"></div>`;
function page({title,desc,path:pp,depth,active,pageType,attr='',body,ld=[],noindex=false,scripts=[],og}){
 const canon=url(pp);
 const r=depthRoot(depth);
 let h=head({title,desc,canon,depth,noindex,ld,og});
 h+=header(depth,active).replace('@PAGE@',pageType).replace('@ATTR@',attr);
 h+=`<main id="main">${body}</main>`+footer(depth);
 h+=`<script src="${r}assets/config.js?v=${BUILD}"></script><script defer src="${r}assets/index.js?v=${BUILD}"></script>`;
 for(const s of scripts)h+=`<script defer src="${r}assets/${s}?v=${BUILD}"></script>`;
 h+=`<script defer src="${r}assets/app.js?v=${BUILD}"></script></body></html>`;
 return h;
}
function write(p,c){const f=`${OUT}/${p}`;fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,c)}
fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
/* index */
const idx=tools.map(t=>({i:t.id,t:t.title,d:t.desc,k:(t.kw||''),s:t.slug||'',c:CAT[t.cat].name,u:toolPath(t)}));
write('assets/index.js','window.EDDA_INDEX='+JSON.stringify(idx)+';');
/* assets */
fs.copyFileSync(`${SRC}/css/style.css`,`${OUT}/assets/style.css`);
fs.copyFileSync(`${SRC}/js/app.js`,`${OUT}/assets/app.js`);
for(const c of CATS)fs.copyFileSync(`${SRC}/js/t-${c.file}.js`,`${OUT}/assets/t-${c.file}.js`);
fs.copyFileSync(ROOT+'/node_modules/qrcode-generator/dist/qrcode.js',`${OUT}/assets/qrcode.js`);
write('assets/config.js','/* إعدادات الإعلانات: الموقع لا يعرض أي إعلانات حاليًا. غيّر enabled إلى true فقط بعد قبول حسابك في برنامج إعلاني معتمد وإضافة الكود الرسمي في ads.js */\nwindow.EDDA_ADS={enabled:false};\n(function(){if(!window.EDDA_ADS||!window.EDDA_ADS.enabled)return;document.addEventListener("DOMContentLoaded",function(){document.querySelectorAll(".ad-slot").forEach(function(s){s.hidden=false;s.removeAttribute("aria-hidden")})})})();');
write('assets/favicon.svg','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#2563eb"/><text x="32" y="46" font-size="40" font-family="Tahoma,Arial,sans-serif" font-weight="700" text-anchor="middle" fill="#fff">ع</text></svg>');
if(fs.existsSync(SRC+'/og.png'))fs.copyFileSync(SRC+'/og.png',OUT+'/assets/og.png');
/* field html */
function fieldHTML(f){
 const id='f-'+f.id;let inner='';
 const hint=f.hint?`<div class="hint">${esc(f.hint)}</div>`:'';
 const common=`id="${id}" name="${f.id}"`;
 switch(f.type){
  case 'textarea':inner=`<textarea ${common} rows="${f.rows||6}" placeholder="${esc(f.ph||'')}"${f.dir?` dir="${f.dir}"`:''}>${esc(f.def||'')}</textarea>`;break;
  case 'select':inner=`<select ${common}>${f.options.map(o=>`<option value="${esc(o[0])}"${String(o[0])===String(f.def)?' selected':''}>${esc(o[1])}</option>`).join('')}</select>`;break;
  case 'checkbox':return `<div class="fld${f.full?' full':''}"><label class="chk"><input type="checkbox" ${common}${f.def?' checked':''}> ${esc(f.label)}</label>${hint}</div>`;
  case 'file':inner=`<input type="file" ${common} ${f.accept?`accept="${f.accept}"`:''}${f.multiple?' multiple':''}>`;break;
  case 'number':inner=`<input type="text" inputmode="decimal" autocomplete="off" ${common} placeholder="${esc(f.ph||'')}" value="${f.def===undefined?'':esc(f.def)}" dir="ltr">`;break;
  case 'range':inner=`<input type="range" ${common} min="${f.min}" max="${f.max}" step="${f.step||1}" value="${f.def}">`;break;
  default:inner=`<input type="${f.type||'text'}" ${common} placeholder="${esc(f.ph||'')}" value="${f.def===undefined?'':esc(f.def)}"${f.dir?` dir="${f.dir}"`:''} autocomplete="off">`;
 }
 return `<div class="fld${f.full||f.type==='textarea'?' full':''}"><label for="${id}">${esc(f.label)}</label>${inner}${hint}</div>`;
}
const POP=['percentage-calculator','word-counter','image-compressor','qr-code-generator','currency-converter','password-generator','discount-calculator','age-calculator'];
const NEW=['financial-goal-calculator','image-watermark','break-even-calculator','invoice-generator','social-image-sizes','hashtag-generator','bio-generator','text-diff'];
const cardStatic=t=>`<a class="card tcard" href="@R@${toolPath(t)}"><b>${esc(t.title)}</b><span>${esc(t.desc)}</span><button class="fav" data-fav="${t.id}" aria-label="إضافة إلى المفضلة" title="المفضلة" type="button">${ico('star')}</button></a>`;
const cards=(list,r)=>list.map(t=>cardStatic(t).replace(/@R@/g,r)).join('');
const byIdMap=Object.fromEntries(tools.map(t=>[t.id,t]));
const catTools=c=>tools.filter(t=>t.cat===c.id||(t.also||[]).includes(c.id));
const crumbs=(items)=>`<nav class="crumbs" aria-label="مسار التنقل">${items.map((x,i)=>i<items.length-1?`<a href="${x[1]}">${esc(x[0])}</a><span>›</span>`:`<b>${esc(x[0])}</b>`).join('')}</nav>`;
/* tool pages */
for(const t of tools){
 const c=CAT[t.cat];const d=2;const r=depthRoot(d);
 const rel=[...(t.related||[])];
 for(const o of catTools(c)){if(o.id!==t.id&&!rel.includes(o.id))rel.push(o.id)}
 const relTools=rel.map(i=>byIdMap[i]).filter(Boolean).slice(0,6);
 for(const i of rel.slice(0,0));
 for(const i of (t.related||[]))if(!byIdMap[i])throw new Error('bad related '+i+' in '+t.id);
 const fields=(t.fields||[]).map(fieldHTML).join('');
 const form=t.mount?`<div id="toolRoot" class="card tool"><noscript><div class="err">هذه الأداة تحتاج تفعيل JavaScript في المتصفح.</div></noscript></div>`:
 `<form id="toolRoot" class="card tool" novalidate><div class="fgrid">${fields}</div><div class="acts"><button class="btn pri" type="button" id="runBtn">${esc(t.btn||'احسب')}</button><button class="btn" type="button" id="clrBtn">مسح</button>${t.ex?'<button class="btn" type="button" id="exBtn">جرّب مثالًا</button>':''}</div><div id="res" class="res" aria-live="polite"></div><noscript><div class="err">هذه الأداة تحتاج تفعيل JavaScript في المتصفح.</div></noscript></form>`;
 const note=t.cat==='write'?`<div class="disc"><b>تنبيه:</b> يعمل هذا المولد بقوالب وقواعد توليد واختيارات منك، وليس نموذج ذكاء اصطناعي. النتائج مقترحات للبدء، فراجعها وعدّلها قبل النشر.</div>`:(t.id==='currency-converter'?`<div class="disc">تُجلب أسعار الصرف مباشرة من مصدر خارجي مجاني عند فتح الأداة (ويظهر تاريخ آخر تحديث ومصدره). لا يُرسل إلى المصدر أي نص أو بيانات شخصية. هذه الأسعار إرشادية وقد تختلف عن أسعار البنوك ومكاتب الصرف.</div>`:'');
 const how=`<ol>${t.how.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>`;
 const faq=t.faqs.map(f=>`<details class="faq"><summary>${esc(f[0])}</summary><p>${esc(f[1])}</p></details>`).join('');
 const body=`<div class="wrap">${crumbs([['الرئيسية',r],[c.name,`${r}${c.slug}/`],[t.title,'']])}
<div class="thead"><div><h1>${esc(t.title)}</h1><p>${esc(t.desc)}</p></div><div class="tact"><button class="btn favbtn" data-fav="${t.id}" type="button" title="إضافة إلى المفضلة">${ico('star')} المفضلة</button><button class="btn" id="shareBtn" type="button">${ico('share')} مشاركة</button></div></div>
${ADS('top')}${note}${form}${ADS('middle')}
<div class="content"><section><h2>تعليمات الاستخدام</h2>${how}</section>
<section><h2>مثال على الاستخدام</h2><div class="exbox"><p style="margin:0">${esc(t.example)}</p>${t.ex?'<p style="margin:10px 0 0"><button class="btn sm" data-example type="button">جرّب هذا المثال</button></p>':''}</div></section>
<section><h2>ما هي ${esc(t.title)}؟</h2><p>${esc(t.about)}</p></section>
<section><h2>متى تحتاج إليها؟</h2><p>${esc(t.when)}</p></section>
<section><h2>أسئلة شائعة</h2>${faq}</section>
<section><h2>أدوات مشابهة</h2><div class="grid">${cards(relTools,r)}</div></section></div>${ADS('bottom')}</div>`;
 const ld=[{'@context':'https://schema.org','@type':'WebApplication',name:t.title,url:url(toolPath(t)),description:t.desc,applicationCategory:'UtilitiesApplication',operatingSystem:'Any',inLanguage:'ar',isAccessibleForFree:true,offers:{'@type':'Offer',price:'0',priceCurrency:'EGP'}},
 {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[['الرئيسية',url('')],[c.name,url(c.slug+'/')],[t.title,url(toolPath(t))]].map((x,i)=>({'@type':'ListItem',position:i+1,name:x[0],item:x[1]}))},
 {'@context':'https://schema.org','@type':'FAQPage',mainEntity:t.faqs.map(f=>({'@type':'Question',name:f[0],acceptedAnswer:{'@type':'Answer',text:f[1]}}))}];
 const sc=[`t-${t.file}.js`];if(t.needs&&t.needs.includes('qr'))sc.unshift('qrcode.js');
 write(toolPath(t)+'index.html',page({title:`${t.title} مجانًا | عُدّة`,desc:t.desc,path:toolPath(t),depth:d,active:c.id,pageType:'tool',attr:`data-tool="${t.id}"`,body,ld,scripts:sc,og:'website'}));
}
/* category pages */
for(const c of CATS){
 const d=1,r=depthRoot(d);const list=catTools(c);
 const body=`<div class="wrap">${crumbs([['الرئيسية',r],[c.name,'']])}<div class="thead"><div><h1>${c.name}</h1><p>${esc(c.desc)}</p></div></div><p>${esc(c.intro)}</p>${ADS('top')}<div class="grid" style="margin-top:14px">${cards(list,r)}</div>${ADS('bottom')}</div>`;
 const ld=[{'@context':'https://schema.org','@type':'CollectionPage',name:c.name,url:url(c.slug+'/'),description:c.desc,inLanguage:'ar',hasPart:list.map(t=>({'@type':'WebApplication',name:t.title,url:url(toolPath(t))}))},{'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[['الرئيسية',url('')],[c.name,url(c.slug+'/')]].map((x,i)=>({'@type':'ListItem',position:i+1,name:x[0],item:x[1]}))}];
 write(c.slug+'/index.html',page({title:`${c.name} المجانية - ${list.length} أداة | عُدّة`,desc:c.desc,path:c.slug+'/',depth:d,active:c.id,pageType:'cat',body,ld}));
}
/* all tools */
{const d=1,r=depthRoot(1);
 const body=`<div class="wrap">${crumbs([['الرئيسية',r],['كل الأدوات','']])}<div class="thead"><div><h1>جميع أدوات عُدّة</h1><p>${tools.length} أداة مجانية تعمل مباشرة في متصفحك، بدون تسجيل.</p></div></div>${CATS.map(c=>`<section class="blk"><h2><a href="${r}${c.slug}/" style="color:inherit">${c.name}</a></h2><div class="grid">${cards(catTools(c).filter(t=>t.cat===c.id),r)}</div></section>`).join('')}</div>`;
 write('tools/index.html',page({title:'جميع الأدوات المجانية | عُدّة',desc:`تصفّح ${tools.length} أداة مجانية: حاسبات، أدوات نصوص وصور، QR، أدوات للتجار، ومساعد كتابة. كل شيء بدون تسجيل.`,path:'tools/',depth:1,active:'all',pageType:'all',body}));}
/* home */
{const r='./';
 const pop=POP.map(i=>byIdMap[i]).filter(Boolean);const nw=NEW.map(i=>byIdMap[i]).filter(Boolean);
 const body=`<section class="hero"><div class="wrap"><span class="tag">مجاني بالكامل · بدون تسجيل · يعمل على جهازك</span><h1>كل أدواتك اليومية.. في عُدّة واحدة.</h1><p>أدوات مجانية تساعدك في الحسابات، الصور، الكتابة، التصميم، وإنجاز مهامك اليومية بسهولة، بدون تسجيل وبدون تعقيد.</p><form data-search role="search" action="search/"><input type="search" name="q" placeholder="ابحث عن أداة: مثال «نسبة مئوية» أو «ضغط صور»" aria-label="ابحث عن أداة" autocomplete="off">${ico('search')}</form></div></section>
<div class="wrap">${ADS('top')}
<section class="blk"><h2>الأدوات الأكثر استخدامًا</h2><div class="grid" id="popList" data-base="${POP.join(',')}">${cards(pop,r)}</div></section>
<section class="blk" id="recentSec" style="display:none"><h2>آخر ما استخدمته</h2><div class="grid" id="recentList"></div></section>
<section class="blk"><h2>أقسام الأدوات</h2><div class="grid">${CATS.map(c=>`<a class="card ccard" href="${c.slug}/"><span class="ci">${ico(c.icon)}</span><div><b>${c.name}</b><span>${catTools(c).filter(t=>t.cat===c.id).length} أداة · ${esc(c.desc.split(':')[0].replace(/\.$/,''))}</span></div></a>`).join('')}</div></section>
<section class="blk"><h2>أدوات جديدة <span class="badge">جديد</span></h2><div class="grid">${cards(nw,r)}</div></section>
<section class="blk"><h2>الأدوات المفضلة</h2><div class="empty" id="favEmpty">لم تضف أدوات إلى المفضلة بعد. اضغط على النجمة ★ في أي أداة لتظهر هنا. تُحفظ مفضلتك على جهازك فقط.</div><div class="grid" id="favList"></div></section>
${ADS('middle')}
<div class="card free"><div><h3>${ico('bolt')} مجاني فعلًا</h3><p>كل الأدوات مجانية دائمًا. لا اشتراكات ولا خطط مدفوعة ولا حدود مخفية.</p></div><div><h3>${ico('lock')} خصوصيتك أولًا</h3><p>الصور والنصوص تُعالج على جهازك ولا تُرفع إلى أي خادم. لا نطلب تسجيلًا.</p></div><div><h3>${ico('phone')} خفيف وسريع</h3><p>يعمل على الهواتف الضعيفة واتصالات الإنترنت البطيئة، وتُحمَّل كل أداة عند الحاجة فقط.</p></div></div>
</div>`;
 const ld=[{'@context':'https://schema.org','@type':'WebSite',name:'عُدّة | 3EDDA',alternateName:'3EDDA',url:url(''),inLanguage:'ar',description:'منصة أدوات إنترنت عربية مجانية: حاسبات، أدوات نصوص وصور، QR، أدوات للتجار ومساعد كتابة.',potentialAction:{'@type':'SearchAction',target:{'@type':'EntryPoint',urlTemplate:url('search/')+'?q={search_term_string}'},'query-input':'required name=search_term_string'}},{'@context':'https://schema.org','@type':'Organization',name:'عُدّة',url:url(''),logo:url('assets/favicon.svg')}];
 write('index.html',page({title:'عُدّة | 3EDDA - أدوات مجانية بالعربية: حاسبات، صور، نصوص وأكثر',desc:'أدوات مجانية تساعدك في الحسابات، الصور، الكتابة، التصميم، وإنجاز مهامك اليومية بسهولة، بدون تسجيل وبدون تعقيد.',path:'',depth:0,active:'home',pageType:'home',body,ld}));}
/* search */
write('search/index.html',page({title:'نتائج البحث | عُدّة',desc:'ابحث عن الأدوات المجانية في عُدّة.',path:'search/',depth:1,pageType:'search',noindex:true,body:`<div class="wrap"><div class="thead"><div><h1>نتائج البحث</h1><p id="sinfo"></p></div></div><div class="grid" id="sres"></div></div>`}));
/* static pages */
const sp=(slug,title,desc,html)=>write(slug+'/index.html',page({title:`${title} | عُدّة`,desc,path:slug+'/',depth:1,pageType:'static',body:`<div class="wrap page">${crumbs([['الرئيسية','../'],[title,'']])}<h1>${title}</h1>${html}</div>`}));
const contactHtml=`<p>يسعدنا سماع ملاحظاتك واقتراحاتك لأدوات جديدة، أو إبلاغك عن أي خطأ تجده في أداة.</p>${REPO?`<p>أسرع طريقة للتواصل هي فتح <a href="${esc(REPO)}/issues" rel="noopener" target="_blank">طلب جديد (Issue) في صفحة المشروع على GitHub</a>. اكتب اسم الأداة ووصف المشكلة أو الفكرة، وإن أمكن اذكر نوع جهازك ومتصفحك.</p>`:`<p>سيتم نشر وسيلة التواصل الرسمية هنا قريبًا.</p>`}<p>موقع عُدّة لا يحتوي على نماذج تُرسل بياناتك إلى أي خادم، ولا نطلب منك أي بيانات شخصية لاستخدام الأدوات.</p><p>ملاحظة: لا يمكننا الرد على الاستفسارات القانونية أو المالية الشخصية. الأدوات إرشادية، راجع <a href="../disclaimer/">إخلاء المسؤولية</a>.</p>`;
sp('about','من نحن','تعرّف على عُدّة: منصة أدوات عربية مجانية بالكامل تعمل على جهازك دون تسجيل ودون جمع بيانات.',`<p><b>عُدّة</b> (3EDDA) منصة أدوات إنترنت عربية مجانية بالكامل. فكرتها بسيطة: كل اللي تحتاجه، في مكان واحد.</p><h2>ماذا نقدّم؟</h2><p>نقدّم أدوات يومية في الحسابات والنصوص والصور والتجارة وتنظيم الوقت، مع مساعد كتابة يعتمد على القوالب. صفحة مستقلة لكل أداة مع شرح بالعربية وأمثلة وأسئلة شائعة.</p><h2>مبادئنا</h2><ul><li><b>مجانية دائمًا:</b> بلا اشتراكات ولا خطط مدفوعة ولا قيود مخفية.</li><li><b>خصوصية:</b> معالجة الصور والنصوص تتم على جهازك، ولا نطلب منك تسجيل حساب.</li><li><b>وضوح:</b> لا ندّعي أن أداة تعمل بالذكاء الاصطناعي إذا لم تكن كذلك، ولا نعرض أسعار صرف مزيفة.</li><li><b>سرعة:</b> صفحات خفيفة تعمل على الهواتف الضعيفة والإنترنت البطيء.</li></ul><h2>كيف يعمل الموقع؟</h2><p>كل الأدوات مبنية بتقنيات الويب الأساسية وتعمل داخل المتصفح. نحفظ تفضيلاتك (الوضع الداكن، المفضلة، آخر الأدوات) على جهازك فقط عبر LocalStorage.</p><p>قد يُموَّل الموقع مستقبلًا بإعلانات غير مزعجة، دون أن يؤثر ذلك على كون الأدوات مجانية.</p>`);
sp('contact','اتصل بنا','تواصل مع فريق عُدّة لاقتراح أدوات جديدة أو الإبلاغ عن مشكلة.',contactHtml);
sp('privacy','سياسة الخصوصية','سياسة خصوصية عُدّة: لا نطلب تسجيلًا، ولا نرفع ملفاتك أو نصوصك إلى خوادمنا، وما يُحفظ يبقى على جهازك.',`<p>آخر تحديث: ${TODAY}</p><p>خصوصيتك أساس تصميم عُدّة. توضح هذه الصفحة ما نفعله وما لا نفعله ببياناتك.</p><h2>ما لا نفعله</h2><ul><li>لا نطلب منك إنشاء حساب أو إدخال بيانات شخصية لاستخدام الأدوات.</li><li>لا نرفع الصور أو الملفات أو النصوص التي تعالجها إلى أي خادم. المعالجة تتم داخل متصفحك.</li><li>لا نبيع بياناتك ولا نشاركها.</li></ul><h2>ما يُحفظ على جهازك</h2><p>نستخدم مساحة التخزين المحلية في المتصفح (LocalStorage) لحفظ: تفضيل الوضع الداكن أو الفاتح، الأدوات المفضلة، آخر الأدوات المستخدمة وعدد مرات استخدامها، وبيانات أدوات مثل قائمة المهام والملاحظات المؤقتة. هذه البيانات تبقى على جهازك ويمكنك حذفها بمسح بيانات الموقع من المتصفح.</p><h2>الاتصال بخدمات خارجية</h2><p>أداة تحويل العملات تجلب أسعار الصرف من خدمة خارجية مجانية (ExchangeRate-API) عند فتحها. يُرسل متصفحك طلبًا عاديًا لجلب الأسعار، ولا يُرسل أي نص أو بيانات منك. قد ترى الخدمة عنوان IP كأي موقع تزوره. غير ذلك لا تتصل الأدوات بأي جهة خارجية.</p><h2>الاستضافة</h2><p>تُستضاف الصفحات على منصة استضافة مجانية قد تحتفظ بسجلات وصول تقنية قياسية (مثل عنوان IP ووقت الزيارة) وفق سياستها الخاصة.</p><h2>الإعلانات</h2><p>لا يعرض الموقع إعلانات حاليًا. إذا أُضيفت إعلانات مستقبلًا فسيتم تحديث هذه السياسة قبل ذلك لتوضيح ملفات تعريف الارتباط المستخدمة وخيارات الموافقة.</p><h2>التواصل</h2><p>لأي استفسار عن الخصوصية استخدم صفحة <a href="../contact/">اتصل بنا</a>.</p>`);
sp('terms','شروط الاستخدام','شروط استخدام موقع عُدّة: الأدوات مجانية وتُقدَّم كما هي، ومسؤولية استخدام النتائج على المستخدم.',`<p>آخر تحديث: ${TODAY}</p><p>باستخدامك موقع عُدّة فإنك توافق على الشروط التالية.</p><h2>الاستخدام المسموح</h2><p>يمكنك استخدام الأدوات مجانًا لأغراضك الشخصية أو التجارية. يُمنع استخدام الموقع في أي نشاط غير قانوني، أو محاولة تعطيل الموقع أو إساءة استخدامه بطلبات آلية مفرطة.</p><h2>الأدوات تُقدَّم كما هي</h2><p>نبذل جهدنا لتكون النتائج صحيحة، لكننا لا نضمن خلوها من الأخطاء أو ملاءمتها لغرض معين. أنت مسؤول عن مراجعة النتائج قبل الاعتماد عليها، خصوصًا في الأمور المالية والتجارية والقانونية.</p><h2>المحتوى الذي تنشئه</h2><p>النصوص والصور والمستندات (مثل الفواتير) التي تنشئها ملكك، ونحن لا نحتفظ بها. مسؤولية صحة محتواها وقانونيتها عليك.</p><h2>التغيير والتوقف</h2><p>قد نضيف أدوات أو نعدّلها أو نوقفها دون إشعار مسبق. قد نحدّث هذه الشروط، واستمرارك في الاستخدام يعني قبول التحديثات.</p><h2>التواصل</h2><p>راجع صفحة <a href="../contact/">اتصل بنا</a>.</p>`);
sp('disclaimer','إخلاء المسؤولية','إخلاء مسؤولية عُدّة: نتائج الأدوات إرشادية ولا تُعد استشارة مالية أو قانونية أو مهنية.',`<p>المعلومات والنتائج التي تقدّمها أدوات عُدّة <b>إرشادية فقط</b>، ولا تُعد استشارة مالية أو ضريبية أو قانونية أو مهنية.</p><ul><li><b>الحاسبات المالية:</b> حاسبة الأقساط والادخار والضريبة وغيرها تعتمد على قيم تدخلها أنت وصيغ رياضية عامة. قد تختلف الشروط الفعلية لدى البنوك والجهات الضريبية، فاستشر مختصًا قبل أي قرار.</li><li><b>أسعار العملات:</b> تُجلب من مصدر خارجي مجاني وقد تتأخر أو تختلف عن أسعار البنوك ومكاتب الصرف. لا تعتمد عليها في عمليات فعلية دون التحقق.</li><li><b>مساعد الكتابة:</b> يعمل بقوالب وقواعد وليس ذكاءً اصطناعيًا. راجع النص قبل استخدامه.</li><li><b>الفواتير وعروض الأسعار:</b> قوالب بسيطة للمساعدة، وليست مستندات ضريبية رسمية معتمدة. التزم بمتطلبات بلدك.</li><li><b>روابط ومصادر خارجية:</b> لا نتحمل مسؤولية محتوى أي موقع خارجي.</li></ul><p>لا تتحمل عُدّة أي مسؤولية عن خسائر أو أضرار ناتجة عن استخدام الأدوات أو الاعتماد على نتائجها.</p>`);
/* 404 */
write('404.html',page({title:'الصفحة غير موجودة | عُدّة',desc:'الصفحة المطلوبة غير موجودة.',path:'404.html',depth:0,pageType:'404',noindex:true,body:`<div class="wrap page" style="text-align:center;padding:50px 0"><h1 style="font-size:3rem;margin:0">404</h1><p>عذرًا، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.</p><p><a class="btn pri" href="${BASE||''}/">العودة إلى الرئيسية</a> <a class="btn" href="${BASE||''}/tools/">تصفّح كل الأدوات</a></p></div>`}).replace(/(href|src|action)="\.\//g,`$1="${BASE}/`).replace('data-root="./"',`data-root="${BASE}/"`));
/* sitemap/robots */
const urls=[['',1.0],['tools/',0.9],...CATS.map(c=>[c.slug+'/',0.8]),...tools.map(t=>[toolPath(t),0.7]),['about/',0.3],['contact/',0.3],['privacy/',0.3],['terms/',0.3],['disclaimer/',0.3]];
write('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`<url><loc>${url(u[0])}</loc><lastmod>${TODAY}</lastmod><priority>${u[1]}</priority></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt',`User-agent: *\nAllow: /\nDisallow: ${BASE}/search/\n\nSitemap: ${url('sitemap.xml')}\n`);
write('.nojekyll','');
console.log('tools:',tools.length,'pages:',tools.length+CATS.length+9,'site',SITE+BASE);
