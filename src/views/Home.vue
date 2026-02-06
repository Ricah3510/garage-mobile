<!-- src/views/Home.vue -->
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar class="custom-toolbar">
        <ion-title>MES VOITURES</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleLogout">
            <ion-icon :icon="logOutOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      
      <!-- Section Bienvenue -->
      <div class="welcome-section">
        <h2>Bienvenue {{ userName }}</h2>
        <p class="subtitle">Gérez vos véhicules</p>
      </div>

      <!-- Bouton TEST Notifications (TEMPORAIRE) -->
      <!-- <ion-button 
        expand="block" 
        color="warning"
        @click="testNotifications"
      >
        🔔 Tester les notifications
      </ion-button> -->

      <!-- Bouton Ajouter Voiture -->
      <ion-button 
        expand="block" 
        class="btn-add-car"
        @click="$router.push('/ajout')"
      >
        <ion-icon :icon="addCircleOutline" slot="start" />
        Ajouter une voiture
      </ion-button>
      <p></p>

      <!-- Loading -->
      <div v-if="isLoading" class="loading-container">
        <ion-spinner name="crescent" color="danger" />
        <p>Chargement de vos voitures...</p>
      </div>

      <!-- Liste des voitures -->
      <div v-else-if="voitures.length > 0" class="voitures-list">
        <ion-card 
          v-for="voiture in voitures" 
          :key="voiture.id"
          class="voiture-card"
        >
          <ion-card-header>
            <div class="card-title-row">
              <ion-icon :icon="carSportOutline" class="car-icon" />
              <div>
                <ion-card-title>{{ voiture.modele }}</ion-card-title>
                <ion-card-subtitle>{{ voiture.immatriculation }}</ion-card-subtitle>
              </div>
            </div>
          </ion-card-header>

          <ion-card-content>
            <div class="car-info">
              <div class="info-row">
                <ion-icon :icon="calendarOutline" />
                <span>Ajoutée le {{ formatDate(voiture.date_creation) }}</span>
              </div>
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Aucune voiture -->
      <div v-else class="empty-state">
        <ion-icon :icon="carSportOutline" class="empty-icon" />
        <h3>Aucune voiture enregistrée</h3>
        <p>Ajoutez votre première voiture pour commencer</p>
        <ion-button @click="$router.push('/ajout')">
          <ion-icon :icon="addCircleOutline" slot="start" />
          Ajouter une voiture
        </ion-button>
      </div>

      <!-- Toast -->
      <ion-toast
        :is-open="showToast"
        :message="toastMessage"
        :duration="3000"
        :color="toastColor"
        @didDismiss="showToast = false"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { onIonViewWillEnter } from '@ionic/vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonButtons, IonIcon, IonCard, IonCardHeader,
  IonCardTitle, IonCardSubtitle, IonCardContent, IonSpinner, IonToast
} from '@ionic/vue'
import {
  logOutOutline, addCircleOutline, carSportOutline, calendarOutline
} from 'ionicons/icons'
import { getCurrentUser, logout } from '../services/auth.service'
import { getVoituresClient } from '../services/firestore.service'
import { setupNotifications } from '../services/notifications.service'

const router = useRouter()
const userInfo = ref<any>(null)
const userName = ref('')
const voitures = ref<any[]>([])
const isLoading = ref(true)

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')

onMounted(async () => {
  const user = getCurrentUser()
  if (user) {
    userInfo.value = user
    userName.value = user.nom || user.email
  } else {
    router.push('/login')
  }
})

// Recharger les voitures à chaque fois qu'on entre sur la page
onIonViewWillEnter(async () => {
  const user = getCurrentUser()
  if (user) {
    userInfo.value = user
    userName.value = user.nom || user.email
    await loadVoitures()
  }
})

  toastMessage.value = 'Initialisation des notifications...'
  toastColor.value = 'primary'
  showToast.value = true

  try {
    await setupNotifications(userInfo.value.id)
    toastMessage.value = '✅ Notifications configurées ! Vérifiez Firebase.'
    toastColor.value = 'success'
    showToast.value = true
  } catch (error: any) {
    toastMessage.value = '❌ Erreur : ' + error.message
    toastColor.value = 'danger'
    showToast.value = true
  }

const loadVoitures = async () => {
  try {
    isLoading.value = true
    const userId = userInfo.value.id
    voitures.value = await getVoituresClient(userId)
  } catch (error) {
    console.error('Erreur chargement voitures:', error)
    toastMessage.value = 'Erreur de chargement'
    toastColor.value = 'danger'
    showToast.value = true
  } finally {
    isLoading.value = false
  }
}

const handleLogout = async () => {
  await logout()
  router.push('/login')
}

const formatDate = (timestamp: any) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('fr-FR')
}
</script>

<style scoped>
/* Toolbar */
.custom-toolbar {
  --background: #000000;
  --color: #FF3B30;
}

.custom-toolbar ion-title {
  font-weight: 900;
  letter-spacing: 2px;
}

/* Welcome Section */
.welcome-section {
  text-align: center;
  margin: 1.5rem 0;
}

.welcome-section h2 {
  color: #FF3B30;
  font-weight: 800;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #666;
  font-size: 0.9rem;
}

/* Bouton Ajouter */
.btn-add-car {
  --background: #FF3B30;
  --border-radius: 12px;
  font-weight: bold;
  margin-bottom: 1.5rem;
}

/* Loading */
.loading-container {
  text-align: center;
  padding: 3rem 0;
}

.loading-container p {
  margin-top: 1rem;
  color: #666;
}

/* Voiture Card */
.voiture-card {
  background: #1a1a1a;
  border-radius: 16px;
  margin-bottom: 1rem;
  border: 1px solid #333;
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.car-icon {
  font-size: 2.5rem;
  color: #FF3B30;
}

.voiture-card ion-card-title {
  color: #FFFFFF;
  font-weight: 700;
}

.voiture-card ion-card-subtitle {
  color: #999;
  font-size: 0.9rem;
}

.voiture-card ion-card-content {
  color: #CCCCCC;
}

.car-info {
  padding: 0.5rem 0;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-size: 0.85rem;
}

.info-row ion-icon {
  color: #FF3B30;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
}

.empty-icon {
  font-size: 5rem;
  color: #333;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: #FFFFFF;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #666;
  margin-bottom: 1.5rem;
}

.empty-state ion-button {
  --background: #FF3B30;
  --border-radius: 12px;
  font-weight: bold;
}
</style>