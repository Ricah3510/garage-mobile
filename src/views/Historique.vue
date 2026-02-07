<!-- src/views/Historique.vue -->
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar class="custom-toolbar">
        <ion-title>HISTORIQUE</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">

      <!-- Loading -->
      <div v-if="isLoading" class="loading-container">
        <ion-spinner name="crescent" color="danger" />
        <p>Chargement de l'historique...</p>
      </div>

      <!-- Liste des réparations -->
      <div v-else-if="reparations.length > 0" class="reparations-list">
        <ion-card
          v-for="reparation in reparations"
          :key="reparation.id"
          class="reparation-card"
        >
          <ion-card-header>
            <div class="card-header-row">
              <div class="vehicle-info">
                <ion-icon :icon="constructOutline" class="repair-icon" />
                <div>
                  <ion-card-title>{{ getVoitureInfo(reparation.id_voiture) }}</ion-card-title>
                  <ion-card-subtitle>
                    {{ formatDate(reparation.date_creation) }}
                  </ion-card-subtitle>
                </div>
              </div>
              <div class="status-badge" :class="reparation.status">
                {{ getStatusLabel(reparation.status) }}
              </div>
            </div>
          </ion-card-header>

          <ion-card-content>
            <!-- Interventions -->
            <div class="interventions-section">
              <h4>
                <ion-icon :icon="hammerOutline" />
                Interventions
              </h4>
              <ul class="interventions-list">
                <li v-for="(intervention, index) in reparation.interventions" :key="index">
                  {{ intervention.nom }} - {{ intervention.prix }} Ar
                </li>
              </ul>
            </div>

            <!-- Total -->
            <div class="total-row">
              <span>Total :</span>
              <strong>{{ reparation.montant_total }} Ar</strong>
            </div>

            <!-- Bouton Payer -->
            <ion-button
              v-if="reparation.status === 'terminee'"
              expand="block"
              class="pay-button"
              @click="openPaymentModal(reparation)"
            >
              <ion-icon :icon="cashOutline" slot="start" />
              Payer maintenant
            </ion-button>

            <!-- Date de paiement -->
            <div v-if="reparation.status === 'payee'" class="paid-date">
              <ion-icon :icon="checkmarkCircleOutline" />
              Payée le {{ formatDate(reparation.date_fin) }}
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <ion-icon :icon="timeOutline" class="empty-icon" />
        <h3>Aucune réparation</h3>
        <p>Vos réparations apparaîtront ici</p>
        <ion-button @click="$router.push('/tabs/reparations')">
          <ion-icon :icon="constructOutline" slot="start" />
          Nouvelle réparation
        </ion-button>
      </div>

      <!-- Modal Paiement -->
      <ion-modal :is-open="showPaymentModal" @didDismiss="showPaymentModal = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Paiement</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showPaymentModal = false">Fermer</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding" v-if="selectedReparation">
          <div class="payment-modal">
            <h3>Récapitulatif</h3>

            <div class="modal-section">
              <p><strong>Véhicule :</strong> {{ getVoitureInfo(selectedReparation.id_voiture) }}</p>
              <p><strong>Interventions :</strong></p>
              <ul>
                <li v-for="(intervention, index) in selectedReparation.interventions" :key="index">
                  {{ intervention.nom }}
                </li>
              </ul>
            </div>

            <div class="modal-total">
              <span>Total à payer :</span>
              <strong>{{ selectedReparation.montant_total }} Ar</strong>
            </div>

            <div class="modal-section">
              <h4>Mode de paiement</h4>
              <div class="payment-methods">
                <div
                  class="payment-method"
                  :class="{ selected: paymentMethod === 'carte' }"
                  @click="paymentMethod = 'carte'"
                >
                  <ion-icon :icon="cardOutline" />
                  <span>Carte bancaire</span>
                </div>
                <div
                  class="payment-method"
                  :class="{ selected: paymentMethod === 'especes' }"
                  @click="paymentMethod = 'especes'"
                >
                  <ion-icon :icon="cashOutline" />
                  <span>Espèces</span>
                </div>
                <div
                  class="payment-method"
                  :class="{ selected: paymentMethod === 'mobile' }"
                  @click="paymentMethod = 'mobile'"
                >
                  <ion-icon :icon="phonePortraitOutline" />
                  <span>Mobile Money</span>
                </div>
              </div>
            </div>

            <ion-button
              expand="block"
              class="confirm-payment-btn"
              @click="confirmPayment"
              :disabled="!paymentMethod || isPaying"
            >
              <ion-icon :icon="checkmarkCircleOutline" slot="start" />
              {{ isPaying ? 'Traitement...' : 'Confirmer le paiement' }}
            </ion-button>
          </div>
        </ion-content>
      </ion-modal>

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
        :is-open="isPaying"
        message="Traitement du paiement..."
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { onIonViewWillEnter } from '@ionic/vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonButtons, IonIcon, IonCard, IonCardHeader,
  IonCardTitle, IonCardSubtitle, IonCardContent, IonSpinner,
  IonModal, IonLoading, IonToast
} from '@ionic/vue'
import {
  timeOutline, constructOutline, cardOutline,
  checkmarkCircleOutline, hammerOutline,
  cashOutline, phonePortraitOutline
} from 'ionicons/icons'
import { getCurrentUser } from '../services/auth.service'
import { 
  getReparationsClient,
  getVoituresClient,
  createPaiement
} from '../services/firestore.service'

const router = useRouter()
const userInfo = ref<any>(null)
const reparations = ref<any[]>([])
const voitures = ref<any[]>([])
const isLoading = ref(true)

// Modal Paiement
const showPaymentModal = ref(false)
const selectedReparation = ref<any>(null)
const paymentMethod = ref('')
const isPaying = ref(false)

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
  await loadReparations()
})

// const loadReparations = async () => {
//   try {
//     isLoading.value = true
    
//     // Charger réparations et voitures en parallèle
//     const [reparationsData, voituresData] = await Promise.all([
//       getReparationsClient(userInfo.value.id),
//       getVoituresClient(userInfo.value.id)
//     ])
    
//     reparations.value = reparationsData
//     voitures.value = voituresData
//   } catch (error) {
//     console.error('Erreur chargement réparations:', error)
//     toastMessage.value = 'Erreur de chargement'
//     toastColor.value = 'danger'
//     showToast.value = true
//   } finally {
//     isLoading.value = false
//   }
// }

const loadReparations = async () => {
  try {
    isLoading.value = true
    
    // Charger réparations et voitures en parallèle
    const [reparationsData, voituresData] = await Promise.all([
      getReparationsClient(userInfo.value.id),
      getVoituresClient(userInfo.value.id)
    ])
    
    // Charger les statuts pour chaque réparation
    const reparationsWithStatus = await Promise.all(
      reparationsData.map(async (reparation: any) => {
        try {
          // Import dynamique de Firestore
          const { collection, query, where, orderBy, getDocs, limit } = await import('firebase/firestore')
          const { db } = await import('../config/firebase')
          
          // Récupérer le dernier statut de cette réparation
          const q = query(
            collection(db, 'reparation_status'),
            where('id_reparation', '==', reparation.id),
            orderBy('date_modification', 'desc'),
            limit(1)
          )
          
          const statusSnapshot = await getDocs(q)
          
          if (!statusSnapshot.empty) {
            const statusDoc = statusSnapshot.docs[0].data()
            return {
              ...reparation,
              status: statusDoc.status,
              date_fin: statusDoc.date_modification
            }
          }
          
          // Par défaut, statut en_attente
          return {
            ...reparation,
            status: 'en_attente'
          }
        } catch (error) {
          console.error('Erreur chargement statut:', error)
          return {
            ...reparation,
            status: 'en_attente'
          }
        }
      })
    )
    
    reparations.value = reparationsWithStatus
    voitures.value = voituresData
  } catch (error) {
    console.error('Erreur chargement réparations:', error)
    toastMessage.value = 'Erreur de chargement'
    toastColor.value = 'danger'
    showToast.value = true
  } finally {
    isLoading.value = false
  }
}

const getVoitureInfo = (voitureId: string) => {
  const voiture = voitures.value.find((v: any) => v.id === voitureId)
  return voiture ? `${voiture.modele} (${voiture.immatriculation})` : 'Véhicule inconnu'
}

const getStatusLabel = (status: string) => {
  const labels: any = {
    'en_attente': 'En attente',
    'en_cours': 'En cours',
    'terminee': 'Terminée',
    'payee': 'Payée'
  }
  return labels[status] || status
}

const formatDate = (timestamp: any) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const openPaymentModal = (reparation: any) => {
  selectedReparation.value = reparation
  paymentMethod.value = ''
  showPaymentModal.value = true
}

const confirmPayment = async () => {
  if (!paymentMethod.value) {
    toastMessage.value = 'Sélectionnez un mode de paiement'
    toastColor.value = 'warning'
    showToast.value = true
    return
  }

  try {
    isPaying.value = true
    
    // Créer le paiement (qui met automatiquement à jour la réparation)
    await createPaiement({
      id_reparation: selectedReparation.value.id,
      id_client: userInfo.value.id,
      montant: selectedReparation.value.montant_total,
      mode_paiement: paymentMethod.value as 'carte' | 'especes' | 'mobile',
      notes: `Paiement via ${paymentMethod.value}`
    })
    
    toastMessage.value = '✅ Paiement effectué avec succès !'
    toastColor.value = 'success'
    showToast.value = true
    
    showPaymentModal.value = false
    
    // Recharger les réparations
    await loadReparations()
  } catch (error) {
    console.error('Erreur paiement:', error)
    toastMessage.value = 'Erreur lors du paiement'
    toastColor.value = 'danger'
    showToast.value = true
  } finally {
    isPaying.value = false
  }
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

/* Loading */
.loading-container {
  text-align: center;
  padding: 3rem 0;
}

.loading-container p {
  color: #999;
  margin-top: 1rem;
}

/* Reparations List */
.reparations-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.reparation-card {
  --background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 16px;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.vehicle-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.repair-icon {
  font-size: 2rem;
  color: #FF3B30;
}

ion-card-title {
  color: #FFFFFF;
  font-weight: 700;
  font-size: 1.1rem;
}

ion-card-subtitle {
  color: #999;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.status-badge {
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.status-badge.en_attente {
  background: rgba(255, 159, 10, 0.2);
  color: #FF9F0A;
}

.status-badge.en_cours {
  background: rgba(10, 132, 255, 0.2);
  color: #0A84FF;
}

.status-badge.terminee {
  background: rgba(48, 209, 88, 0.2);
  color: #30D158;
}

.status-badge.payee {
  background: rgba(191, 90, 242, 0.2);
  color: #BF5AF2;
}

.interventions-section {
  margin-bottom: 1rem;
}

.interventions-section h4 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #FF3B30;
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 0.75rem;
}

.interventions-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.interventions-list li {
  color: #999;
  font-size: 0.9rem;
  padding: 0.4rem 0;
  border-bottom: 1px solid #333;
}

.interventions-list li:last-child {
  border-bottom: none;
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  background: rgba(255, 59, 48, 0.1);
  border-radius: 8px;
  margin: 1rem 0;
}

.total-row span {
  color: #999;
  font-weight: 600;
}

.total-row strong {
  color: #30D158;
  font-size: 1.2rem;
  font-weight: 900;
}

.pay-button {
  --background: #30D158;
  --border-radius: 12px;
  font-weight: bold;
  height: 48px;
}

.paid-date {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #BF5AF2;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.75rem;
  background: rgba(191, 90, 242, 0.1);
  border-radius: 8px;
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
  margin-bottom: 1.5rem;
}

/* Payment Modal */
.payment-modal {
  padding: 1rem 0;
}

.payment-modal h3 {
  color: #FFFFFF;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

.modal-section {
  margin-bottom: 1.5rem;
}

.modal-section p {
  color: #999;
  margin-bottom: 0.5rem;
}

.modal-section strong {
  color: #FFFFFF;
}

.modal-section ul {
  list-style: none;
  padding-left: 1rem;
}

.modal-section li {
  color: #999;
  margin: 0.25rem 0;
}

.modal-section h4 {
  color: #FF3B30;
  font-weight: 600;
  margin-bottom: 1rem;
}

.modal-total {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  background: rgba(255, 59, 48, 0.1);
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.modal-total span {
  color: #999;
  font-weight: 600;
}

.modal-total strong {
  color: #30D158;
  font-size: 1.5rem;
  font-weight: 900;
}

.payment-methods {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.payment-method {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #1a1a1a;
  border: 2px solid #333;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.payment-method:hover,
.payment-method.selected {
  border-color: #FF3B30;
  background: rgba(255, 59, 48, 0.05);
}

.payment-method ion-icon {
  font-size: 1.5rem;
  color: #FF3B30;
}

.payment-method span {
  color: #FFFFFF;
  font-weight: 600;
}

.confirm-payment-btn {
  --background: #30D158;
  --border-radius: 12px;
  font-weight: bold;
  margin-top: 1.5rem;
  height: 50px;
}
</style>