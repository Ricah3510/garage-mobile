// src/services/notifications.service.ts
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import app from '../config/firebase'
import { saveClient } from './firestore.service'

const messaging = getMessaging(app)

// Clé VAPID depuis Firebase Console
const VAPID_KEY = 'BBN1klxAlB_mPCiM9_0d4ZqdDvMcG92qhrHBfHifI4NXqSPdOCLrwp9SDJZgQMuVygos683o_j6o_miLQt631-w'

/**
 * Enregistrer le Service Worker et attendre qu'il soit actif
 */
const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker non supporté')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    console.log('✅ Service Worker enregistré:', registration)
    
    // Attendre que le Service Worker soit actif
    if (registration.active) {
      console.log('✅ Service Worker déjà actif')
      return registration
    }
    
    // Si pas encore actif, attendre
    console.log('⏳ Attente activation Service Worker...')
    await new Promise<void>((resolve) => {
      const checkActive = setInterval(() => {
        if (registration.active) {
          console.log('✅ Service Worker activé')
          clearInterval(checkActive)
          resolve()
        }
      }, 100)
    })
    
    return registration
  } catch (error) {
    console.error('❌ Erreur enregistrement Service Worker:', error)
    return null
  }
}

/**
 * Demander la permission pour les notifications
 */
const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('Notifications non supportées')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

/**
 * Obtenir le token FCM
 */
const getFCMToken = async (registration: ServiceWorkerRegistration): Promise<string | null> => {
  try {
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    })

    if (token) {
      console.log('✅ FCM Token obtenu:', token)
      return token
    } else {
      console.warn('⚠️ Aucun token FCM obtenu')
      return null
    }
  } catch (error) {
    console.error('❌ Erreur obtention token FCM:', error)
    return null
  }
}

/**
 * Initialiser les notifications FCM
 */
export const setupNotifications = async (clientId: string) => {
  console.log('🔔 Initialisation des notifications FCM...')

  // 1. Demander la permission
  const hasPermission = await requestNotificationPermission()
  if (!hasPermission) {
    console.warn('❌ Permission notifications refusée')
    return
  }

  // 2. Enregistrer le Service Worker
  const registration = await registerServiceWorker()
  if (!registration) {
    console.warn('❌ Service Worker non disponible')
    return
  }

  // 3. Obtenir le token FCM
  const fcmToken = await getFCMToken(registration)
  if (!fcmToken) {
    console.warn('❌ Token FCM non obtenu')
    return
  }

  // 4. Sauvegarder le token dans Firestore
  try {
    await saveClient(clientId, { fcm_token: fcmToken })
    console.log('✅ Token FCM sauvegardé dans Firestore')
  } catch (error) {
    console.error('❌ Erreur sauvegarde token:', error)
  }

  // 5. Écouter les messages quand l'app est au premier plan
  onMessage(messaging, (payload) => {
    console.log('📩 Message reçu (app au premier plan):', payload)

    const notificationTitle = payload.notification?.title || '🔧 Garage Naka'
    const notificationBody = payload.notification?.body || 'Nouvelle notification'

    // Afficher une notification même si l'app est ouverte
    if (Notification.permission === 'granted') {
      new Notification(notificationTitle, {
        body: notificationBody,
        icon: '/icon.png',
        badge: '/icon.png',
        tag: 'garage-notification',
        data: payload.data
      })
    }
  })

  console.log('✅ Notifications FCM configurées avec succès !')
}

/**
 * Arrêter les notifications (optionnel, pas vraiment nécessaire avec FCM)
 */
export const stopNotifications = () => {
  console.log('🔕 Notifications désactivées')
  // Avec FCM, pas besoin d'arrêter l'écoute
}

/**
 * Tester une notification locale (pour développement)
 */
export const testNotification = () => {
  if (Notification.permission === 'granted') {
    new Notification('🔧 Test Notification', {
      body: 'Ceci est une notification de test du Garage Naka',
      icon: '/icon.png',
      badge: '/icon.png',
      tag: 'test-notification'
    })
  } else {
    console.warn('Permission notifications non accordée')
  }
}