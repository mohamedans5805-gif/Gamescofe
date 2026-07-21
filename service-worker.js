// Service Worker لكيمز كوفي — بسيط ومحافظ عمداً
// الهدف: السماح بتثبيت التطبيق على الشاشة الرئيسية فقط، بدون أي تخزين مؤقت عدواني
// يعني: دائماً يجيب آخر نسخة من الإنترنت أول، ولا يخزن index.html أو menu.html أبداً
// هذا يمنع مشاكل "نسخة قديمة عالقة بالكاش" اللي واجهناها سابقاً

const CACHE_NAME = 'kims-coffee-v1';

// لا نخزن أي صفحة HTML مسبقاً — بس اسم الكاش موجود لأغراض مستقبلية بسيطة (أيقونات مثلاً)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// إستراتيجية "الشبكة أولاً دائماً" لكل الطلبات — إذا فشل الإنترنت فقط نحاول الكاش كحل أخير
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // نخزن نسخة احتياطية بصمت للاستخدام أوقات انقطاع النت فقط (لا يؤثر على أولوية الشبكة)
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        }).catch(() => {});
        return networkResponse;
      })
      .catch(() => {
        // ما فيه إنترنت حالياً، نرجع آخر نسخة محفوظة إذا موجودة
        return caches.match(event.request);
      })
  );
});
