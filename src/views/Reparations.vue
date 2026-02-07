<!-- src/views/Reparations.vue -->
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar class="custom-toolbar">
        <ion-title>NOUVELLE RÉPARATION</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">

      <!-- Step Indicator -->
      <div class="steps-indicator">
        <div class="step" :class="{ active: !selectedVoiture }">
          <div class="step-number">1</div>
          <span>Véhicule</span>
        </div>
        <div class="step-divider"></div>
        <div class="step" :class="{ active: selectedVoiture }">
          <div class="step-number">2</div>
          <span>Interventions</span>
        </div>
      </div>

      <!-- STEP 1 : Sélection Voiture -->
      <div v-if="!selectedVoiture" class="step-content">
        <h3 class="step-title">
          <ion-icon :icon="carSportOutline" />
          Sélectionnez un véhicule
        </h3>

        <div v-if="loadingVoitures" class="loading-section">
          <ion-spinner name="crescent" color="danger" />
          <p>Chargement des voitures...</p>
        </div>

        <div v-else-if="voitures.length > 0" class="voitures-grid">
          <div
            v-for="voiture in voitures"
            :key="voiture.id"
            class="voiture-card"
            @click="selectVoiture(voiture)"
          >
            <ion-icon :icon="carSportOutline" class="voiture-icon" />
            <div class="voiture-info">
              <h4>{{ voiture.modele }}</h4>
              <p>{{ voiture.immatriculation }}</p>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <ion-icon :icon="carSportOutline" class="empty-icon" />
          <p>Aucune voiture disponible</p>
          <ion-button fill="outline" @click="$router.push('/ajout')">
            Ajouter une voiture
          </ion-button>
        </div>
      </div>

      <!-- STEP 2 : Sélection Interventions -->
      <div v-else class="step-content">
        <h3 class="step-title">
          <ion-icon :icon="constructOutline" />
          Sélectionnez les interventions
        </h3>

        <!-- Voiture sélectionnée -->
        <div class="selected-car-banner">
          <ion-icon :icon="carSportOutline" />
          <div>
            <strong>{{ selectedVoiture.modele }}</strong>
            <span>{{ selectedVoiture.immatriculation }}</span>
          </div>
          <ion-button fill="clear" size="small" @click="selectedVoiture = null">
            Changer
          </ion-button>
        </div>

        <div v-if="loadingInterventions" class="loading-section">
          <ion-spinner name="crescent" color="danger" />
          <p>Chargement des interventions...</p>
        </div>

        <div v-else class="interventions-list">
          <div
            v-for="intervention in interventions"
            :key="intervention.id"
            class="intervention-card"
            :class="{ selected: selectedInterventions.includes(intervention.id) }"
            @click="toggleIntervention(intervention.id)"
          >
            <ion-checkbox
              :checked="selectedInterventions.includes(intervention.id)"
              @click.stop="toggleIntervention(intervention.id)"
            />
            <div class="intervention-details">
              <h4>{{ intervention.nom }}</h4>
              <div class="intervention-meta">
                <span>
                  <ion-icon :icon="timeOutline" />
                  {{ Math.floor(intervention.duree_secondes / 60) }} min
                </span>
                <span class="price">{{ intervention.prix }} Ar</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Summary -->
        <div v-if="selectedInterventions.length > 0" class="summary-card">
          <h4>
            <ion-icon :icon="listOutline" />
            Résumé
          </h4>
          <div class="summary-row">
            <span>Véhicule :</span>
            <strong>{{ selectedVoiture.modele }}</strong>
          </div>
          <div class="summary-row">
            <span>Interventions :</span>
            <strong>{{ selectedInterventions.length }}</strong>
          </div>
          <div class="summary-row">
            <span>Durée totale :</span>
            <strong>{{ calculateDuration() }} min</strong>
          </div>
          <div class="summary-row total">
            <span>Total :</span>
            <strong>{{ calculateTotal() }} Ar</strong>
          </div>

          <ion-button
            expand="block"
            class="submit-btn"
            @click="submitReparation"
            :disabled="isSubmitting"
          >
            <ion-icon :icon="checkmarkCircleOutline" slot="start" />
            {{ isSubmitting ? 'Envoi en cours...' : 'Valider la réparation' }}
          </ion-button>
        </div>

        <div v-else class="info-box">
          <ion-icon :icon="informationCircleOutline" />
          <p>Sélectionnez au moins une intervention</p>
        </div>
      </div>

      <!-- Toast -->
      <ion-toast
        :is-open="showToast"
        :message="toastMessage"
        :duration="3000"
        :color="toastColor"
        @didDismiss="showToast = false"
      />

      <!-- Loading Overlay -->
      <ion-loading
        :is-open="isSubmitting"
        message="Création de la réparation..."
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
  IonButton, IonIcon, IonSpinner, IonCheckbox,
  IonLoading, IonToast
} from '@ionic/vue'
import {
  constructOutline, carSportOutline, checkmarkCircleOutline,
  timeOutline, listOutline, informationCircleOutline
} from 'ionicons/icons'
import { getCurrentUser } from '../services/auth.service'
import { 
  getVoituresClient, 
  getInterventions,
  createReparation
} from '../services/firestore.service'

const router = useRouter()
const userInfo = ref<any>(null)

// Voitures
const voitures = ref<any[]>([])
const selectedVoiture = ref<any>(null)
const loadingVoitures = ref(true)

// Interventions
const interventions = ref<any[]>([])
const selectedInterventions = ref<string[]>([])
const loadingInterventions = ref(true)

// Submission
const isSubmitting = ref(false)

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')

// Recharger à CHAQUE entrée sur la page
onIonViewWillEnter(async () => {
  const user = getCurrentUser()
  if (!user) {
    router.push('/login')
    return
  }
  
  userInfo.value = user
  
  // RESET complet de l'état
  selectedVoiture.value = null
  selectedInterventions.value = []
  
  // Charger les données
  await Promise.all([loadVoitures(), loadInterventions()])
  
  // Démarrer l'écoute en temps réel
  startRealtimeListeners()
})

onUnmounted(() => {
  // Arrêter l'écoute quand on quitte la page
  stopRealtimeListeners()
})

let unsubscribeVoitures: (() => void) | null = null
let unsubscribeInterventions: (() => void) | null = null

const startRealtimeListeners = () => {
  if (!userInfo.value) return
  
  // Arrêter les anciens listeners si existent
  stopRealtimeListeners()
  
  // Importer onSnapshot depuis Firebase
  import('firebase/firestore').then(({ onSnapshot, collection, query, where, orderBy }) => {
    import('../config/firebase').then(({ db }) => {
      // Écouter les voitures
      const qVoitures = query(
        collection(db, 'voitures'),
        where('id_client', '==', userInfo.value.id),
        orderBy('date_creation', 'desc')
      )
      
      unsubscribeVoitures = onSnapshot(qVoitures, (snapshot) => {
        console.log('🔄 Mise à jour temps réel des voitures')
        voitures.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      })
      
      // Écouter les interventions
      const qInterventions = collection(db, 'interventions')
      
      unsubscribeInterventions = onSnapshot(qInterventions, (snapshot) => {
        console.log('🔄 Mise à jour temps réel des interventions')
        interventions.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      })
    })
  })
}

const stopRealtimeListeners = () => {
  if (unsubscribeVoitures) {
    unsubscribeVoitures()
    unsubscribeVoitures = null
  }
  if (unsubscribeInterventions) {
    unsubscribeInterventions()
    unsubscribeInterventions = null
  }
}

const loadVoitures = async () => {
  try {
    loadingVoitures.value = true
    const userId = userInfo.value.id
    voitures.value = await getVoituresClient(userId)
  } catch (error) {
    console.error('Erreur chargement voitures:', error)
    toastMessage.value = 'Erreur de chargement des voitures'
    toastColor.value = 'danger'
    showToast.value = true
  } finally {
    loadingVoitures.value = false
  }
}

const loadInterventions = async () => {
  try {
    loadingInterventions.value = true
    interventions.value = await getInterventions()
  } catch (error) {
    console.error('Erreur chargement interventions:', error)
    toastMessage.value = 'Erreur de chargement des interventions'
    toastColor.value = 'danger'
    showToast.value = true
  } finally {
    loadingInterventions.value = false
  }
}

const selectVoiture = (voiture: any) => {
  selectedVoiture.value = voiture
  selectedInterventions.value = []
}

const toggleIntervention = (interventionId: string) => {
  const index = selectedInterventions.value.indexOf(interventionId)
  if (index > -1) {
    selectedInterventions.value.splice(index, 1)
  } else {
    selectedInterventions.value.push(interventionId)
  }
}

const calculateTotal = () => {
  return selectedInterventions.value.reduce((total, id) => {
    const intervention = interventions.value.find(i => i.id === id)
    return total + (intervention?.prix || 0)
  }, 0)
}

const calculateDuration = () => {
  const totalSeconds = selectedInterventions.value.reduce((total, id) => {
    const intervention = interventions.value.find(i => i.id === id)
    return total + (intervention?.duree_secondes || 0)
  }, 0)
  return Math.floor(totalSeconds / 60)
}

const submitReparation = async () => {
  if (selectedInterventions.value.length === 0) {
    toastMessage.value = 'Sélectionnez au moins une intervention'
    toastColor.value = 'warning'
    showToast.value = true
    return
  }

  try {
    isSubmitting.value = true
    
    const interventionsDetails = selectedInterventions.value.map(id => {
      const intervention = interventions.value.find(i => i.id === id)
      return {
        id: intervention.id,
        nom: intervention.nom,
        duree_secondes: intervention.duree_secondes,
        prix: intervention.prix
      }
    })
    
    await createReparation({
      id_voiture: selectedVoiture.value.id,
      id_client: userInfo.value.id,
      interventions: interventionsDetails,
      montant_total: calculateTotal()
    })
    
    toastMessage.value = '✅ Réparation soumise avec succès !'
    toastColor.value = 'success'
    showToast.value = true
    
    // Rediriger vers l'historique après 1.5 secondes
    setTimeout(() => {
      router.push('/tabs/historique')
    }, 1500)
    
  } catch (error) {
    console.error('Erreur soumission réparation:', error)
    toastMessage.value = 'Erreur lors de la soumission'
    toastColor.value = 'danger'
    showToast.value = true
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
/* Toolbar */
.custom-toolbar {
  --background: #000000;
  --color: #FF3B30;
}

/* Steps Indicator */
.steps-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 0;
  margin-bottom: 1rem;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.5;
  transition: opacity 0.3s;
}

.step.active {
  opacity: 1;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #333;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  border: 2px solid #333;
}

.step.active .step-number {
  background: #FF3B30;
  color: #FFF;
  border-color: #FF3B30;
}

.step span {
  font-size: 0.85rem;
  color: #999;
}

.step.active span {
  color: #FFF;
  font-weight: 600;
}

.step-divider {
  width: 60px;
  height: 2px;
  background: #333;
  margin: 0 1rem;
}

/* Step Content */
.step-content {
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.step-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #FF3B30;
  font-weight: 700;
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
}

.step-title ion-icon {
  font-size: 1.5rem;
}

/* Loading */
.loading-section {
  text-align: center;
  padding: 3rem 0;
}

.loading-section p {
  color: #999;
  margin-top: 1rem;
}

/* Voitures Grid */
.voitures-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.voiture-card {
  background: #1a1a1a;
  border: 2px solid #333;
  border-radius: 12px;
  padding: 1.5rem 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.voiture-card:hover {
  border-color: #FF3B30;
  transform: translateY(-2px);
}

.voiture-icon {
  font-size: 3rem;
  color: #FF3B30;
  margin-bottom: 0.75rem;
}

.voiture-info h4 {
  color: #FFF;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.voiture-info p {
  color: #999;
  font-size: 0.85rem;
}

/* Selected Car Banner */
.selected-car-banner {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 59, 48, 0.1);
  border: 1px solid #FF3B30;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.selected-car-banner ion-icon {
  font-size: 2rem;
  color: #FF3B30;
}

.selected-car-banner div {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.selected-car-banner strong {
  color: #FFF;
  font-size: 1.1rem;
}

.selected-car-banner span {
  color: #FF3B30;
  font-size: 0.9rem;
}

/* Interventions List */
.interventions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.intervention-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #1a1a1a;
  border: 2px solid #333;
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.intervention-card:hover,
.intervention-card.selected {
  border-color: #FF3B30;
  background: rgba(255, 59, 48, 0.05);
}

.intervention-details {
  flex: 1;
}

.intervention-details h4 {
  color: #FFF;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.intervention-meta {
  display: flex;
  gap: 1.5rem;
  font-size: 0.85rem;
}

.intervention-meta span {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: #999;
}

.intervention-meta ion-icon {
  color: #FF3B30;
}

.intervention-meta .price {
  color: #30D158;
  font-weight: 700;
}

/* Summary Card */
.summary-card {
  background: #1a1a1a;
  border: 2px solid #FF3B30;
  border-radius: 16px;
  padding: 1.5rem;
}

.summary-card h4 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #FF3B30;
  font-weight: 700;
  margin-bottom: 1rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #333;
  color: #999;
}

.summary-row:last-of-type {
  border-bottom: none;
}

.summary-row strong {
  color: #FFF;
}

.summary-row.total {
  font-size: 1.2rem;
  color: #FFF;
  padding-top: 1rem;
  margin-top: 0.5rem;
  border-top: 2px solid #FF3B30;
  border-bottom: none;
}

.summary-row.total strong {
  color: #30D158;
  font-weight: 900;
}

.submit-btn {
  --background: #30D158;
  --border-radius: 12px;
  font-weight: bold;
  margin-top: 1.5rem;
  height: 50px;
}

/* Info Box */
.info-box {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(10, 132, 255, 0.1);
  border: 1px solid rgba(10, 132, 255, 0.3);
  border-radius: 12px;
  color: #0A84FF;
}

.info-box ion-icon {
  font-size: 1.5rem;
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

.empty-state p {
  color: #999;
  margin-bottom: 1.5rem;
}
</style>