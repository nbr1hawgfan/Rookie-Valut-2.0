const CACHE_NAME = "rookie-vault-v13";
const APP_SHELL = ["./","./index.html","./css/app.css?v=13","./js/app.js?v=13","./manifest.webmanifest","./icons/icon.svg"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_SHELL)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET")return;
 if(e.request.mode==="navigate"){e.respondWith(fetch(e.request,{cache:"no-store"}).then(r=>{const x=r.clone();caches.open(CACHE_NAME).then(c=>c.put("./index.html",x));return r}).catch(()=>caches.match("./index.html")));return}
 const u=new URL(e.request.url),code=u.pathname.endsWith("/css/app.css")||u.pathname.endsWith("/js/app.js");
 if(code){e.respondWith(fetch(e.request,{cache:"no-store"}).then(r=>{const x=r.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,x));return r}).catch(()=>caches.match(e.request)));return}
 e.respondWith(caches.match(e.request).then(x=>x||fetch(e.request).then(r=>{const y=r.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,y));return r})))
});