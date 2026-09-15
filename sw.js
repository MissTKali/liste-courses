var CACHE_NAME = "liste-courses-v2-2";
var FILES = [
  "./", "./index.html", "./historique.html", "./style.css", "./app.js", "./historique.js",
  "./manifest.json", "./icons/icon-192.png", "./icons/icon-512.png"
];
self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE_NAME).then(function (cache) { return cache.addAll(FILES); }));
  self.skipWaiting();
});
self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (names) {
    return Promise.all(names.map(function (name) { if (name !== CACHE_NAME) { return caches.delete(name); } }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") { return; }
  event.respondWith(fetch(event.request).then(function (response) {
    var copy = response.clone(); caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, copy); }); return response;
  }).catch(function () { return caches.match(event.request); }));
});
