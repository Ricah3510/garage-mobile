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
        <h2>🔧 Bienvenue {{ userName }}</h2>
        <p class="subtitle">Gérez vos véhicules</p>
      </div>

      <!-- Bouton Ajouter Voiture -->
      <ion-button 
        expand="block" 
        class="btn-add-car"
        @click="$router.push('/ajout')"
      >
        <ion-icon :icon="addCircleOutline" slot="start" />
        Ajouter une voiture
      </ion-button>

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
          class="car-card"
        >
          <ion-card-header>
            <div class="card-header-content">
              <ion-icon :icon="carSportOutline" class="car-icon" />
              <div>
                <ion-card-title>{{ voiture.modele }}</ion-card-title>
                <ion-card-subtitle>{{ voiture.immatriculation }}</ion-card-subtitle>
              </div>
            </div>
          </ion-card-header>
          <ion-card-content>
            <div class="car-info">
              <ion-icon :icon="calendarOutline" />
              <span>Ajoutée le {{ formatDate(voiture.date_creation) }}</span>
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <ion-icon :icon="carSportOutline" class="empty-icon" />
        <h3>Aucune voiture</h3>
        <p>Ajoutez votre première voiture pour commencer</p>
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
import { ref, onUnmounted } from 'vue'
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

const router = useRouter()
const userInfo = ref<any>(null)
const userName = ref('')
const voitures = ref<any[]>([])
const isLoading = ref(true)

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')

// Recharger les voitures à CHAQUE entrée sur la page
onIonViewWillEnter(async () => {
  const user = getCurrentUser()
  if (!user) {
    router.push('/login')
    return
  }
  
  userInfo.value = user
  userName.value = user.nom || user.email
  await loadVoitures()
  
  // Démarrer l'écoute en temps réel
  startRealtimeListener()
})

onUnmounted(() => {
  // Arrêter l'écoute quand on quitte la page
  stopRealtimeListener()
})

let unsubscribeVoitures: (() => void) | null = null

const startRealtimeListener = () => {
  if (!userInfo.value) return
  
  // Arrêter l'ancien listener si existe
  stopRealtimeListener()
  
  // Importer onSnapshot depuis Firebase
  import('firebase/firestore').then(({ onSnapshot, collection, query, where, orderBy }) => {
    import('../config/firebase').then(({ db }) => {
      const q = query(
        collection(db, 'voitures'),
        where('id_client', '==', userInfo.value.id),
        orderBy('date_creation', 'desc')
      )
      
      unsubscribeVoitures = onSnapshot(q, (snapshot) => {
        console.log('🔄 Mise à jour temps réel des voitures')
        voitures.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      })
    })
  })
}

const stopRealtimeListener = () => {
  if (unsubscribeVoitures) {
    unsubscribeVoitures()
    unsubscribeVoitures = null
  }
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
  padding: 2rem 1rem;
  margin-bottom: 1rem;
}

.welcome-section h2 {
  color: #FFFFFF;
  font-weight: 800;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #999;
  font-size: 0.95rem;
}

/* Add Car Button */
.btn-add-car {
  --background: #FF3B30;
  --border-radius: 12px;
  font-weight: bold;
  margin-bottom: 2rem;
  height: 50px;
}

/* Loading */
.loading-container {
  text-align: center;
  padding: 3rem 0;
}

.loading-container p {
  color: #999;
  margin-top: 1rem;
}

/* Car Cards */
.voitures-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.car-card {
  --background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 16px;
}

.card-header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.car-icon {
  font-size: 2.5rem;
  color: #FF3B30;
}

ion-card-title {
  color: #FFFFFF;
  font-weight: 700;
  font-size: 1.2rem;
}

ion-card-subtitle {
  color: #FF3B30;
  font-weight: 600;
  font-size: 0.95rem;
  margin-top: 0.25rem;
}

.car-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #999;
  font-size: 0.9rem;
}

.car-info ion-icon {
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
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #999;
}
</style>