const CACHE_NAME = 'baekhopang_V1'; // manifest.json 수정 시 버전정보 변경 필요

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        './',
        './index.html',
        './main.js',
        './manifest.json',
        './main.css',
        './icon-192.png', // 아이콘 변경필요
        './icon-512.png'  // 아이콘 변경필요
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
