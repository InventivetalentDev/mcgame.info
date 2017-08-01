'use strict';

self.addEventListener('push', function (event) {
    console.log('[Service Worker] Push Received.');
    console.log('[Service Worker] Push had this data: ' + event.data.text());

    var data = event.data.json();

    const title = data.title || "MC GameInfo";
    const options = {
        body: data.body,
        icon: data.icon || '/img/logo-256.png',
        badge: '/img/logo-badge-128.png',
        actions: data.actions || [],
        data: data.data || {}
    };
    // https://stackoverflow.com/questions/30795431/icon-not-displaying-in-notification-white-square-shown-instead
    console.log(options)

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
    console.log("notificationClick")
    console.log(event)

    event.notification.close();

    if (event.notification.data.clickUrl) {
        focusOrOpenWindow(event, event.notification.data.clickUrl);
    } else {
        if (event.notification.data.actionUrls) {
            if (event.notification.data.actionUrls[event.action]) {
                focusOrOpenWindow(event, event.notification.data.actionUrls[event.action]);
            }
        }
    }
})

function focusOrOpenWindow(event, url) {
    event.waitUntil(
        clients.matchAll({type: 'window'}).then(function (windowClients) {
            // Check if there is already a window/tab open with the target URL
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                // If so, just focus it.
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, then open the target URL in a new window/tab.
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
}