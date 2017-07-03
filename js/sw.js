'use strict';

self.addEventListener('push', function (event) {
    console.log('[Service Worker] Push Received.');
    console.log('[Service Worker] Push had this data: ' + event.data.text());

    const title = "MC GameInfo";
    const options = {
        body: event.data.text(),
        icon: '/img/logo-256.png',
        badge: '/img/logo-256.png'
    };

    event.waitUntil(self.registration.showNotification(title, options));
});