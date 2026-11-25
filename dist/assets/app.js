(function(){
var EDDA=window.EDDA=window.EDDA||{tools:{}};
EDDA.tool=EDDA.tool||function(t){EDDA.tools[t.id]=t};
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var ROOT=document.documentElement.getAttribute('data-root')||'./';
var LS={get:function(k,d){try{var v=localStorage.getItem('edda.'+k);return v?JSON.parse(v):d}catch(e){return d}},set:function(k,v){try{localStorage.setItem('edda.'+k,JSON.stringify(v))}catch(e){}}};
EDDA.LS=LS;
/* utils */
var U=EDDA.util={
 fmt:function(n,d){if(n===null||n===undefined||isNaN(n)||!isFinite(n))return '—';return Number(n).toLocaleString('en-US',{maximumFractionDigits:d===undefined?2:d,minimumFractionDigits:0})},
 money:function(n){if(n===null||isNaN(n)||!isFinite(n))return '—';return Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})},
 need:function(v){for(var i=1;i<arguments.length;i++){var k=arguments[i];if(v[k]===null||v[k]===undefined||v[k]===''||(typeof v[k]==='number'&&isNaN(v[k])))throw new Error('يرجى إدخال قيمة صحيحة في حقل: '+(EDDA._labels&&EDDA._labels[k]||k))}},
 pos:function(v,k){if(v[k]<0)throw new Error('لا يمكن أن تكون القيمة سالبة في حقل: '+(EDDA._labels&&EDDA._labels[k]||k))},
 pick:function(a){return a[Math.floor(Math.random()*a.length)]},
 shuffle:function(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a},
 esc:function(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})},
 copy:function(text){if(navigator.clipboard&&window.isSecureContext)return navigator.clipboard.writeText(text);return new Promise(function(res,rej){var t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();try{document.execCommand('copy')?res():rej()}catch(e){rej(e)}document.body.removeChild(t)})},
 download:function(blob,name){var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1500)},
 bytes:function(n){if(n<1024)return n+' بايت';if(n<1048576)return (n/1024).toFixed(1)+' ك.ب';return (n/1048576).toFixed(2)+' م.ب'},
 el:function(tag,attrs,html){var e=document.createElement(tag);if(attrs)for(var k in attrs)e.setAttribute(k,attrs[k]);if(html!==undefined)e.innerHTML=html;return e}
};
/* theme */
function setTheme(t){document.documentElement.setAttribute('data-theme',t);LS.set('theme',t);var m=$('#themeBtn');if(m)m.innerHTML='<svg class="ico"><use href="#i-'+(t==='dark'?'sun':'moon')+'"/></svg>';m&&m.setAttribute('aria-label',t==='dark'?'الوضع الفاتح':'الوضع الداكن')}
document.addEventListener('DOMContentLoaded',function(){
 setTheme(document.documentElement.getAttribute('data-theme')||'light');
 var tb=$('#themeBtn');tb&&tb.addEventListener('click',function(){setTheme(document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark')});
 var mb=$('#menuBtn');mb&&mb.addEventListener('click',function(){var n=$('nav.main');var o=n.classList.toggle('open');mb.setAttribute('aria-expanded',o)});
 initSearch();initFavs();initPage();
});
/* search */
var IDX=function(){return window.EDDA_INDEX||[]};
var norm=function(s){return String(s).toLowerCase().replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي')};
EDDA.search=function(q,limit){q=norm(q).trim();if(!q)return [];var parts=q.split(/\s+/);var out=[];IDX().forEach(function(t){var hay=norm(t.t+' '+t.d+' '+t.k+' '+t.s);var title=norm(t.t);var sc=0;var ok=parts.every(function(p){if(title.indexOf(p)>-1){sc+=title.indexOf(p)===0?6:4;return true}if(hay.indexOf(p)>-1){sc+=1;return true}return false});if(ok)out.push([sc,t])});out.sort(function(a,b){return b[0]-a[0]});return out.slice(0,limit||8).map(function(x){return x[1]})};
function initSearch(){
 $$('form[data-search]').forEach(function(f){
  var inp=$('input',f);var box=U.el('div',{class:'sugg',role:'listbox'});f.appendChild(box);f.style.position='relative';var act=-1;
  function render(){var r=EDDA.search(inp.value,7);if(!r.length||!inp.value.trim()){box.classList.remove('open');box.innerHTML='';return}box.innerHTML=r.map(function(t){return '<a href="'+ROOT+t.u+'">'+U.esc(t.t)+'<small>'+U.esc(t.c)+'</small></a>'}).join('');box.classList.add('open');act=-1}
  inp.addEventListener('input',render);
  inp.addEventListener('keydown',function(e){var as=$$('a',box);if(e.key==='ArrowDown'||e.key==='ArrowUp'){if(!as.length)return;e.preventDefault();act=(act+(e.key==='ArrowDown'?1:-1)+as.length)%as.length;as.forEach(function(a,i){a.classList.toggle('act',i===act)})}else if(e.key==='Enter'&&act>-1){e.preventDefault();location.href=as[act].href}else if(e.key==='Escape')box.classList.remove('open')});
  document.addEventListener('click',function(e){if(!f.contains(e.target))box.classList.remove('open')});
  f.addEventListener('submit',function(e){e.preventDefault();var q=inp.value.trim();if(q)location.href=ROOT+'search/?q='+encodeURIComponent(q)});
 });
}
/* favorites / recents */
function favs(){return LS.get('fav',[])}
function cardHTML(t){return '<a class="card tcard" href="'+ROOT+t.u+'"><b>'+U.esc(t.t)+'</b><span>'+U.esc(t.d)+'</span><button class="fav'+(favs().indexOf(t.i)>-1?' on':'')+'" data-fav="'+t.i+'" aria-label="إضافة إلى المفضلة" title="المفضلة"><svg class="ico"><use href="#i-star"/></svg></button></a>'}
EDDA.cardHTML=cardHTML;
function toggleFav(id){var f=favs();var i=f.indexOf(id);if(i>-1)f.splice(i,1);else f.push(id);LS.set('fav',f);$$('[data-fav="'+id+'"]').forEach(function(b){b.classList.toggle('on',f.indexOf(id)>-1)});renderLists()}
function initFavs(){document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-fav]');if(b){e.preventDefault();e.stopPropagation();toggleFav(b.getAttribute('data-fav'))}})}
function byId(id){var r=IDX().filter(function(t){return t.i===id});return r[0]}
function renderLists(){
 var fe=$('#favList');if(fe){var f=favs().map(byId).filter(Boolean);fe.innerHTML=f.length?f.map(cardHTML).join(''):'';var em=$('#favEmpty');if(em)em.style.display=f.length?'none':'block'}
 var re=$('#recentList');if(re){var r=LS.get('recent',[]).map(byId).filter(Boolean);re.innerHTML=r.map(cardHTML).join('');var sec=$('#recentSec');if(sec)sec.style.display=r.length?'block':'none'}
 var pe=$('#popList');if(pe){var u=LS.get('usage',{});var base=(pe.getAttribute('data-base')||'').split(',');var all=IDX().slice().sort(function(a,b){var ua=u[a.i]||0,ub=u[b.i]||0;if(ua!==ub)return ub-ua;var ia=base.indexOf(a.i),ib=base.indexOf(b.i);return (ia<0?99:ia)-(ib<0?99:ib)});pe.innerHTML=all.slice(0,8).map(cardHTML).join('')}
}
function trackUse(id){var u=LS.get('usage',{});u[id]=(u[id]||0)+1;LS.set('usage',u);var r=LS.get('recent',[]);r=[id].concat(r.filter(function(x){return x!==id})).slice(0,8);LS.set('recent',r)}
/* page init */
function initPage(){
 var pg=document.body.getAttribute('data-page');
 renderLists();
 if(pg==='search'){var q=new URLSearchParams(location.search).get('q')||'';var inp=$('#sq');if(inp)inp.value=q;var out=$('#sres');var r=EDDA.search(q,60);$('#sinfo').textContent=q?(r.length?'تم العثور على '+r.length+' أداة لـ «'+q+'»':'لا توجد نتائج لـ «'+q+'». جرّب كلمة أخرى أو تصفّح الأقسام.'):'اكتب اسم الأداة التي تبحث عنها.';out.innerHTML=r.map(cardHTML).join('')}
 if(pg==='tool')initTool();
}
/* tool runtime */
function initTool(){
 var id=document.body.getAttribute('data-tool');var T=EDDA.tools[id];var root=$('#toolRoot');
 if(!T){root.innerHTML='<div class="err">تعذّر تحميل الأداة. حدّث الصفحة وحاول مرة أخرى.</div>';return}
 EDDA._labels={};(T.fields||[]).forEach(function(f){EDDA._labels[f.id]=f.label});
 var used=false;function mark(){if(!used){used=true;trackUse(id)}}
 var res=$('#res');
 function val(){var v={};(T.fields||[]).forEach(function(f){var e=$('#f-'+f.id);if(!e)return;if(f.type==='file')v[f.id]=Array.prototype.slice.call(e.files||[]);else if(f.type==='checkbox')v[f.id]=e.checked;else if(f.type==='number'||f.type==='range'){var s=String(e.value).trim().replace(/,/g,'');v[f.id]=s===''?null:Number(s)}else v[f.id]=e.value});return v}
 function show(h,text,node){res.classList.add('show');res.innerHTML='';var box=U.el('div');box.innerHTML=h;if(node)box.appendChild(node);res.appendChild(box);res._text=text||'';if(text){var bt=U.el('div',{class:'rbtns'});var cp=U.el('button',{class:'btn sm',type:'button'},'<svg class="ico"><use href="#i-copy"/></svg> نسخ النتيجة');cp.onclick=function(){U.copy(res._text).then(function(){cp.textContent='تم النسخ ✓';setTimeout(function(){cp.innerHTML='<svg class="ico"><use href="#i-copy"/></svg> نسخ النتيجة'},1500)},function(){cp.textContent='تعذّر النسخ'})};bt.appendChild(cp);var ru=U.el('button',{class:'btn sm',type:'button'},'إعادة الاستخدام');ru.title='استخدم النتيجة كمدخل جديد أو عدّل المدخلات وأعد التنفيذ';ru.onclick=function(){var ta=$('textarea',root);if(ta&&T.reuse){ta.value=res._text;ta.focus();ta.dispatchEvent(new Event('input'))}else{var f=$('input,select,textarea',root);f&&f.focus();window.scrollTo({top:root.getBoundingClientRect().top+window.scrollY-80,behavior:'smooth'})}};bt.appendChild(ru);res.appendChild(bt)}}
 function render(o){
  if(o===undefined||o===null)return;
  if(typeof o==='string')return show('<div class="rtext">'+U.esc(o)+'</div>',o);
  var h='',text=o.text;
  if(o.rows){h+='<table class="rtab">'+o.rows.map(function(r){return '<tr'+(r[2]?' class="hl"':'')+'><td>'+U.esc(r[0])+'</td><td>'+U.esc(r[1])+'</td></tr>'}).join('')+'</table>';if(text===undefined)text=o.rows.map(function(r){return r[0]+': '+r[1]}).join('\n')}
  else if(o.text!==undefined&&!o.html)h+='<div class="rtext">'+U.esc(o.text)+'</div>';
  if(o.html)h+=o.html;
  if(o.note)h+='<div class="rnote">'+U.esc(o.note)+'</div>';
  show(h,text,o.node);
 }
 function fail(e){res.classList.add('show');res.innerHTML='<div class="err">'+U.esc(e&&e.message?e.message:'حدث خطأ غير متوقع')+'</div>';res._text=''}
 var ctx={render:render,fail:fail,root:root,res:res,mark:mark,show:show};
 function run(){mark();try{var r=T.run(val(),ctx);if(r&&typeof r.then==='function'){res.classList.add('show');res.innerHTML='<div class="rnote">جارٍ المعالجة…</div>';r.then(render,fail)}else render(r)}catch(e){fail(e)}}
 if(T.mount){T.mount(root,ctx);mark();return wireCommon()}
 $('#runBtn').addEventListener('click',run);
 root.addEventListener('submit',function(e){e.preventDefault();run()});
 if(T.live){var tmo;root.addEventListener('input',function(e){if(e.target.type==='file')return;clearTimeout(tmo);tmo=setTimeout(function(){try{var v=val();var any=Object.keys(v).some(function(k){return v[k]!==null&&v[k]!==''&&v[k]!==false});if(any)run();else res.classList.remove('show')}catch(e){}},150)})}
 function setVals(m){(T.fields||[]).forEach(function(f){var e=$('#f-'+f.id);if(!e||f.type==='file')return;var x=m[f.id];if(x===undefined)x=f.def===undefined?'':f.def;if(f.type==='checkbox')e.checked=!!x;else e.value=x})}
 var clr=$('#clrBtn');clr&&clr.addEventListener('click',function(){setVals({});(T.fields||[]).forEach(function(f){var e=$('#f-'+f.id);if(e&&f.type==='file')e.value=''});res.classList.remove('show');res.innerHTML='';var p=$('#pv');p&&(p.innerHTML='')});
 function example(){if(!T.ex)return;setVals(T.ex);run();root.scrollIntoView({behavior:'smooth',block:'start'})}
 $$('[data-example]').forEach(function(b){b.addEventListener('click',example)});
 var exb=$('#exBtn');exb&&exb.addEventListener('click',example);
 wireCommon();
}
function wireCommon(){
 var sh=$('#shareBtn');sh&&sh.addEventListener('click',function(){var d={title:document.title,url:location.href.split('#')[0]};if(navigator.share){navigator.share(d).catch(function(){})}else U.copy(d.url).then(function(){var o=sh.innerHTML;sh.textContent='تم نسخ الرابط ✓';setTimeout(function(){sh.innerHTML=o},1600)})});
}
})();
