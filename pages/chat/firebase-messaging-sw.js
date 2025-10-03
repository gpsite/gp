importScripts('https://www.gstatic.com/firebasejs/12.2.1//firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.2.1//firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDhPv49xQEXZCmhfXZwDgq3GsMezpAsRbc",
  authDomain: "gp-chat-5c186.firebaseapp.com",
  projectId: "gp-chat-5c186",
  messagingSenderId: "611958051858",
  appId: "1:611958051858:web:dbb118278f6e69d79774cb"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || 'New notification', {
    body: body || '',
    icon: icon || '/icon.png',
    data: payload.data || {}
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if ('focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
