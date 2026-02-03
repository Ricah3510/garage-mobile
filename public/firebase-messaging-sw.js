// public/firebase-messaging-sw.js

// Import Firebase scripts pour Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCAxyLa0iv3Gt56pSCmPL1YoekTW7quAkc",
  authDomain: "garage-simulation.firebaseapp.com",
  projectId: "garage-simulation",
  storageBucket: "garage-simulation.firebasestorage.app",
  messagingSenderId: "258101790728",
  appId: "1:258101790728:web:5d66fdb7c61efd6cc5a9bd",
  measurementId: "G-4LYQ0WGQMY"
};

// Initialiser Firebase dans le Service Worker
firebase.initializeApp(firebaseConfig);

// Récupérer l'instance de messaging
const messaging = firebase.messaging();

// Gérer les notifications en arrière-plan (quand l'app est fermée)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Message reçu en arrière-plan:', payload);

  const notificationTitle = payload.notification?.title || '🔧 Garage Naka';
  const notificationOptions = {
    body: payload.notification?.body || 'Nouvelle notification',
    icon: '/icon.png',
    badge: '/icon.png',
    tag: 'garage-notification',
    requireInteraction: true, // La notification reste jusqu'à ce que l'utilisateur clique
    data: payload.data || {}
  };

  // Afficher la notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Gérer le clic sur la notification
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification cliquée:', event);
  
  event.notification.close();

  // Ouvrir ou focus l'application
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si l'app est déjà ouverte, la mettre au premier plan
      for (const client of clientList) {
        if (client.url.includes('localhost') || client.url.includes('vercel.app')) {
          return client.focus();
        }
      }
      
      // Sinon, ouvrir une nouvelle fenêtre
      if (clients.openWindow) {
        return clients.openWindow('/tabs/historique');
      }
    })
  );
});

console.log('[firebase-messaging-sw.js] Service Worker Firebase Messaging chargé');