<!-- src/views/LayoutTabs.vue -->
<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      
      <ion-tab-bar slot="bottom" class="custom-tab-bar">
        <!-- Tab 1 : Home / Voitures -->
        <ion-tab-button tab="home" href="/tabs/home">
          <ion-icon :icon="carSportOutline" />
          <ion-label>Voitures</ion-label>
        </ion-tab-button>

        <!-- Tab 2 : Réparations -->
        <ion-tab-button tab="reparations" href="/tabs/reparations">
          <ion-icon :icon="constructOutline" />
          <ion-label>Réparations</ion-label>
        </ion-tab-button>

        <!-- Tab 3 : Historique -->
        <ion-tab-button tab="historique" href="/tabs/historique">
          <ion-icon :icon="timeOutline" />
          <ion-label>Historique</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>

    <!-- Toast pour les notifications web -->
    <ion-toast
      :is-open="showToast"
      :message="toastMessage"
      :duration="5000"
      color="success"
      position="top"
      @didDismiss="showToast = false"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage, IonTabs, IonTabBar, IonTabButton,
  IonIcon, IonLabel, IonRouterOutlet, IonToast
} from '@ionic/vue'
import { carSportOutline, constructOutline, timeOutline } from 'ionicons/icons'
import { getCurrentUser } from '../services/auth.service'
import { setupNotifications, stopNotifications } from '../services/notifications.service'
import { useNotificationBus } from '../services/notification-bus.service'

const router = useRouter()
const { notificationEvent, clearNotification } = useNotificationBus()

// Toast pour les notifications
const showToast = ref(false)
const toastMessage = ref('')

// Écouter les notifications
watch(notificationEvent, (newEvent) => {
  if (newEvent) {
    toastMessage.value = `${newEvent.title}: ${newEvent.body}`
    showToast.value = true
    clearNotification()
  }
})

onMounted(async () => {
  // Vérifier que l'utilisateur est connecté
  const user = getCurrentUser()
  
  if (!user) {
    router.push('/login')
    return
  }
  
  // Activer les notifications avec protection contre les erreurs
  try {
    console.log('🔔 Activation des notifications...')
    await setupNotifications(user.id)
    console.log('✅ Notifications activées avec succès')
  } catch (error) {
    console.error('❌ Erreur activation notifications:', error)
    // Ne pas bloquer l'app si les notifications échouent
  }
})

onUnmounted(() => {
  // Arrêter les notifications quand l'utilisateur quitte l'app
  console.log('🔕 Désactivation des notifications...')
  stopNotifications()
})
</script>

<style scoped>
.custom-tab-bar {
  --background: #000000;
  --color: #999999;
  border-top: 1px solid #333;
  height: 60px;
}

ion-tab-button {
  --color: #999999;
  --color-selected: #FF3B30;
  font-weight: 600;
}

ion-tab-button ion-icon {
  font-size: 1.5rem;
}

ion-tab-button ion-label {
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

/* Animation au clic */
ion-tab-button::part(native) {
  transition: all 0.3s ease;
}

ion-tab-button:active {
  transform: scale(0.95);
}
</style>