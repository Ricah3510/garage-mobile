// src/services/notifications.service.ts
import { isPlatform } from '@ionic/vue'
import { PushNotifications } from '@capacitor/push-notifications'
import { LocalNotifications } from '@capacitor/local-notifications'
import { saveClient } from './firestore.service'
import { useNotificationBus } from './notification-bus.service'

const { triggerNotification } = useNotificationBus()

// Clé VAPID depuis Firebase Console
const VAPID_KEY = 'BBN1klxAlB_mPCiM9_0d4ZqdDvMcG92qhrHBfHifI4NXqSPdOCLrwp9SDJZgQMuVygos683o_j6o_miLQt631-w'

/**
 * ═══════════════════════════════════════════════════════════
 * MOBILE : Capacitor Push Notifications (Android/iOS)
 * ═══════════════════════════════════════════════════════════
 */
const setupMobileNotifications = async (clientId: string) => {
  console.log('📱 Configuration Push Notifications MOBILE')

  try {
    // Demander la permission
    const permResult = await PushNotifications.requestPermissions()
    
    if (permResult.receive !== 'granted') {
      console.warn('❌ Permission notifications refusée')
      return
    }

    console.log('✅ Permission accordée')

    // Enregistrer pour recevoir les notifications
    await PushNotifications.register()

    // Écouter le token FCM
    PushNotifications.addListener('registration', async (token) => {
      console.log('✅ FCM Token (mobile):', token.value)
      
      // Sauvegarder le token dans Firestore
      try {
        await saveClient(clientId, { fcm_token: token.value })
        console.log('✅ Token sauvegardé dans Firestore')
      } catch (error) {
        console.error('❌ Erreur sauvegarde token:', error)
      }
    })

    // Écouter les erreurs d'enregistrement
    PushNotifications.addListener('registrationError', (error) => {
      console.error('❌ Erreur enregistrement:', error)
    })

    // Notification reçue quand l'app est au premier plan
    PushNotifications.addListener('pushNotificationReceived', async (notification) => {
      console.log('📩 Notification reçue (app ouverte):', notification)
      
      // Créer une notification locale pour l'afficher même au premier plan
      try {
        // Demander la permission pour les notifications locales
        await LocalNotifications.requestPermissions()
        
        // Afficher la notification locale
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Date.now(),
              title: notification.title || '🔧 Garage Naka',
              body: notification.body || 'Nouvelle notification',
              smallIcon: 'ic_stat_icon_config_sample',
              sound: undefined,
              attachments: undefined,
              actionTypeId: '',
              extra: notification.data
            }
          ]
        })
      } catch (err) {
        console.error('Erreur affichage notification locale:', err)
      }
    })

    // Notification cliquée
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('👆 Notification cliquée:', notification)
      // TODO: Naviguer vers l'historique
    })

    console.log('✅ Push Notifications mobile configurées')
  } catch (error) {
    console.error('❌ Erreur configuration mobile:', error)
  }
}

/**
 * ═══════════════════════════════════════════════════════════
 * WEB : Firebase Cloud Messaging (Navigateur PC)
 * ═══════════════════════════════════════════════════════════
 */
const setupWebNotifications = async (clientId: string) => {
  console.log('🌐 Configuration FCM WEB')

  try {
    // Import Firebase Messaging uniquement sur web
    const { getMessaging, getToken, onMessage } = await import('firebase/messaging')
    const app = (await import('../config/firebase')).default
    const messaging = getMessaging(app)

    // Demander la permission
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.warn('❌ Permission notifications refusée')
      return
    }

    console.log('✅ Permission accordée')

    // Enregistrer le Service Worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    console.log('✅ Service Worker enregistré')

    // Attendre que le SW soit actif
    if (!registration.active) {
      console.log('⏳ Attente activation Service Worker...')
      await new Promise<void>((resolve) => {
        const checkActive = setInterval(() => {
          if (registration.active) {
            console.log('✅ Service Worker actif')
            clearInterval(checkActive)
            resolve()
          }
        }, 100)
        
        // Timeout après 10 secondes
        setTimeout(() => {
          clearInterval(checkActive)
          resolve()
        }, 10000)
      })
    }

    // Obtenir le token FCM
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    })

    if (token) {
      console.log('✅ FCM Token (web):', token)
      
      // Sauvegarder dans Firestore
      try {
        await saveClient(clientId, { fcm_token: token })
        console.log('✅ Token sauvegardé dans Firestore')
      } catch (error) {
        console.error('❌ Erreur sauvegarde token:', error)
      }
    } else {
      console.warn('⚠️ Aucun token FCM obtenu')
    }

    // Écouter les messages quand l'app est au premier plan
    onMessage(messaging, (payload) => {
      console.log('📩 Message FCM reçu (app ouverte):', payload)

      const title = payload.notification?.title || '🔧 Garage Naka'
      const body = payload.notification?.body || 'Nouvelle notification'

      // Déclencher un événement pour afficher un toast dans l'app
      triggerNotification(title, body)
      
      console.log('✅ Toast de notification déclenché')
    })

    console.log('✅ FCM Web configuré')
  } catch (error) {
    console.error('❌ Erreur configuration web:', error)
  }
}

/**
 * ═══════════════════════════════════════════════════════════
 * INITIALISATION (détection automatique de la plateforme)
 * ═══════════════════════════════════════════════════════════
 */
export const setupNotifications = async (clientId: string) => {
  console.log('🔔 Initialisation des notifications...')
  console.log('🎯 Plateforme détectée:', isPlatform('capacitor') ? 'MOBILE' : 'WEB')

  if (isPlatform('capacitor')) {
    // Sur mobile natif (Android/iOS)
    await setupMobileNotifications(clientId)
  } else {
    // Sur navigateur web (PC)
    await setupWebNotifications(clientId)
  }
}

/**
 * Arrêter les notifications (optionnel)
 */
export const stopNotifications = () => {
  console.log('🔕 Notifications désactivées')
  
  if (isPlatform('capacitor')) {
    PushNotifications.removeAllListeners()
  }
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