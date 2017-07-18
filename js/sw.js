'use strict';

self.addEventListener('push', function (event) {
    console.log('[Service Worker] Push Received.');
    console.log('[Service Worker] Push had this data: ' + event.data.text());

    var data = event.data.json();

    const title = data.title || "MC GameInfo";
    const options = {
        body: data.body,
        icon: data.icon || '/img/logo-256.png',
        badge: '/img/logo-badge-128.png'
    };
    // https://stackoverflow.com/questions/30795431/icon-not-displaying-in-notification-white-square-shown-instead
    console.log(options)

    event.waitUntil(self.registration.showNotification(title, options));
});