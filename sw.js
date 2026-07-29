// Service Worker cho "Sổ Tay Tiếng Anh Đa Năng"
// Mục đích: (1) đủ điều kiện để trình duyệt cho phép "Cài đặt ứng dụng",
// (2) cache trang để có thể mở lại khi mất mạng (dữ liệu vẫn dùng localStorage/Firebase như cũ).

const CACHE_NAME = 'english-notebook-cache-v1';
const APP_SHELL_URL = self.registration ? self.location.href.replace('sw.js', 'index.html') : './';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Cache trang hiện tại (đường dẫn mà service worker này được đăng ký từ đó)
            return cache.addAll([self.location.pathname.replace('sw.js', '')]).catch(() => {
                // Bỏ qua nếu không cache được trước (sẽ cache dần khi fetch)
            });
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Chiến lược: Network-first cho trang HTML chính (để luôn lấy bản mới nhất khi có mạng),
// rơi về cache khi mất mạng. Các request khác (CDN, API...) đi thẳng qua mạng như bình thường.
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);
    const isSameOrigin = url.origin === self.location.origin;
    const isHtmlNavigation = event.request.mode === 'navigate';

    if (isSameOrigin && isHtmlNavigation) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
    }
});
