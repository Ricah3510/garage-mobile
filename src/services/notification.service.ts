// src/services/notifications.service.ts
import { isPlatform } from '@ionic/vue'
import { db } from '../config/firebase'
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore'
import { Token } from '@capacitor/push-notifications'

let unsubscribe: any = null

/**
 * Demander la permission pour les notifications web
 */
const requestWebNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('Ce navigateur ne supporte pas les notifications')
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
 * Afficher une notification web
 */
const showWebNotification = (title: string, body: string, data?: any) => {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '/icon.png', // Vous pouvez ajouter une icône
      badge: '/icon.png',
      tag: 'garage-notification',
      data
    })

    // Clic sur la notification
    notification.onclick = () => {
      window.focus()
      notification.close()
      //  Naviguer vers l'historique
      if (data?.reparationId) {
        console.log('Rediriger vers réparation:', data.reparationId)
      }
    }
  }
}

/**
 * Configuration des notifications WEB (pour développement PC)
 */
const setupWebNotifications = async (clientId: string) => {
  console.log('🌐 Configuration notifications WEB')
  
  // Demander la permission
  const hasPermission = await requestWebNotificationPermission()
  
  if (!hasPermission) {
    console.warn('Permission notifications refusée')
    return
  }

  // Écouter les changements de status en temps réel
  const statusQuery = query(
    collection(db, 'reparation_status'),
    orderBy('date_modification', 'desc')
  )

  unsubscribe = onSnapshot(statusQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const statusData = change.doc.data()
        
        // Si le status est "terminee", envoyer notification
        if (statusData.status === 'terminee') {
          // Vérifier que c'est bien une réparation du client
          checkAndNotify(clientId, statusData.id_reparation)
        }
      }
    })
  })

  console.log('✅ Écoute des notifications activée')
}

/**
 * Vérifier si la réparation appartient au client et notifier
 */
const checkAndNotify = async (clientId: string, reparationId: string) => {
  try {
    // Importer getReparation pour éviter circular dependency
    const { getReparation } = await import('./firestore.service')
    const reparation = await getReparation(reparationId)
    
    if (reparation && reparation.id_client === clientId) {
      // C'est une réparation du client, envoyer notification
      showWebNotification(
        'Réparation Terminée !',
        'Votre véhicule est prêt. Vous pouvez venir le récupérer après paiement.',
        { reparationId }
      )
    }
  } catch (error) {
    console.error('Erreur vérification réparation:', error)
  }
}

/**
 * Configuration des notifications FCM (pour mobile Android/iOS)
 */
const setupFCMNotifications = async (clientId: string) => {
  console.log('📱 Configuration notifications FCM (mobile)')
  
  // TODO: À implémenter plus tard quand on testera sur mobile
  // Nécessite: npm install @capacitor/push-notifications
  
  try {
    // Import dynamique pour éviter les erreurs sur web
    const { PushNotifications } = await import('@capacitor/push-notifications')
    
    // Demander la permission
    const result = await PushNotifications.requestPermissions()
    
    if (result.receive === 'granted') {
      // Enregistrer pour recevoir les notifications
      await PushNotifications.register()
      
      // Récupérer le token FCM
    //   PushNotifications.addListener('registration', async (token) => {
        
        PushNotifications.addListener('registration', async (token: Token) => {
        console.log('FCM Token:', token.value)
        // Sauvegarder le token dans Firestore
        const { saveClient } = await import('./firestore.service')
        await saveClient(clientId, { fcm_token: token.value })
      })
      
      // Gérer les notifications reçues
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Notification reçue:', notification)
      })
      
      // Gérer les clics sur notifications
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Notification cliquée:', notification)
      })
    }
  } catch (error) {
    console.warn('FCM non disponible:', error)
    // Fallback sur notifications web
    await setupWebNotifications(clientId)
  }
}

/**
 * Initialiser les notifications (détection automatique de la plateforme)
 */
export const setupNotifications = async (clientId: string) => {
  // Arrêter l'écoute précédente si elle existe
  if (unsubscribe) {
    unsubscribe()
  }

  if (isPlatform('android') || isPlatform('ios')) {
    // Mobile : utiliser FCM
    await setupFCMNotifications(clientId)
  } else {
    // Web : utiliser Notification API
    await setupWebNotifications(clientId)
  }
}

/**
 * Arrêter l'écoute des notifications
 */
export const stopNotifications = () => {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
    console.log(' Notifications désactivées')
  }
}

export const testNotification = () => {
  showWebNotification(
    'Test Notification',
    'Ceci est une notification de test du Garage Naka',
    { test: true }
  )
}