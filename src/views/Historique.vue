<!-- src/views/Historique.vue -->
<template>
    <ion-page>
      <ion-header>
        <ion-toolbar class="custom-toolbar">
          <ion-title>HISTORIQUE</ion-title>
        </ion-toolbar>
      </ion-header>
  
      <ion-content :fullscreen="true" class="ion-padding">
        
        <!-- Header -->
        <div class="header-section">
          <ion-icon :icon="timeOutline" class="header-icon" />
          <h2>Vos Réparations</h2>
          <p>Suivez l'état de vos réparations en temps réel</p>
        </div>
  
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
            <!-- En-tête -->
            <ion-card-header>
              <div class="card-header-content">
                <div>
                  <ion-card-title>{{ reparation.voiture_info?.modele }}</ion-card-title>
                  <ion-card-subtitle>{{ reparation.voiture_info?.immatriculation }}</ion-card-subtitle>
                </div>
                <div class="status-badge" :class="getStatusClass(reparation.status)">
                  <ion-icon :icon="getStatusIcon(reparation.status)" />
                  {{ getStatusLabel(reparation.status) }}
                </div>
              </div>
            </ion-card-header>
  
            <!-- Contenu -->
            <ion-card-content>
              <!-- Date -->
              <div class="info-row">
                <ion-icon :icon="calendarOutline" />
                <span>Créée le {{ formatDate(reparation.date_creation) }}</span>
              </div>
  
              <!-- Interventions -->
              <div class="interventions-section">
                <p class="section-title">Interventions :</p>
                <div 
                  v-for="(intervention, index) in reparation.interventions" 
                  :key="index"
                  class="intervention-item"
                >
                  <ion-icon :icon="constructOutline" />
                  <span>{{ intervention.nom }}</span>
                  <span class="prix">{{ intervention.prix }}€</span>
                </div>
              </div>
  
              <!-- Total -->
              <div class="total-section">
                <strong>TOTAL</strong>
                <span class="total-prix">{{ reparation.montant_total }}€</span>
              </div>
  
              <!-- Bouton Payer si terminé -->
              <ion-button 
                v-if="reparation.status === 'terminee'"
                expand="block"
                class="btn-pay"
                @click="openPaymentModal(reparation)"
              >
                <ion-icon :icon="cardOutline" slot="start" />
                Payer maintenant
              </ion-button>
  
              <!-- Statut payée -->
              <div v-if="reparation.status === 'payee'" class="paid-badge">
                <ion-icon :icon="checkmarkCircleOutline" />
                <span>Payée le {{ formatDate(reparation.date_fin) }}</span>
              </div>
            </ion-card-content>
          </ion-card>
        </div>
  
        <!-- Aucune réparation -->
        <div v-else class="empty-state">
          <ion-icon :icon="constructOutline" class="empty-icon" />
          <h3>Aucune réparation</h3>
          <p>Vous n'avez pas encore soumis de réparation</p>
          <ion-button @click="$router.push('/tabs/reparations')">
            <ion-icon :icon="hammerOutline" slot="start" />
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
          
          <ion-content class="ion-padding">
            <div v-if="selectedReparation" class="payment-content">
              <!-- Info réparation -->
              <div class="payment-summary">
                <h3>📋 Récapitulatif</h3>
                
                <div class="summary-row">
                  <span>Voiture</span>
                  <strong>{{ selectedReparation.voiture_info?.modele }}</strong>
                </div>
                
                <div class="summary-row">
                  <span>Immatriculation</span>
                  <strong>{{ selectedReparation.voiture_info?.immatriculation }}</strong>
                </div>
  
                <div class="summary-row">
                  <span>Interventions</span>
                  <strong>{{ selectedReparation.interventions?.length }}</strong>
                </div>
  
                <div class="total-payment-row">
                  <strong>MONTANT À PAYER</strong>
                  <span class="amount">{{ selectedReparation.montant_total }}€</span>
                </div>
              </div>
  
              <!-- Méthodes de paiement -->
              <div class="payment-methods">
                <h3>💳 Méthode de paiement</h3>
                
                <div class="payment-options">
                  <div 
                    class="payment-option"
                    :class="{ 'selected': paymentMethod === 'card' }"
                    @click="paymentMethod = 'card'"
                  >
                    <ion-icon :icon="cardOutline" />
                    <span>Carte bancaire</span>
                    <ion-icon v-if="paymentMethod === 'card'" :icon="checkmarkCircleOutline" class="check" />
                  </div>
  
                  <div 
                    class="payment-option"
                    :class="{ 'selected': paymentMethod === 'cash' }"
                    @click="paymentMethod = 'cash'"
                  >
                    <ion-icon :icon="cashOutline" />
                    <span>Espèces</span>
                    <ion-icon v-if="paymentMethod === 'cash'" :icon="checkmarkCircleOutline" class="check" />
                  </div>
  
                  <div 
                    class="payment-option"
                    :class="{ 'selected': paymentMethod === 'mobile' }"
                    @click="paymentMethod = 'mobile'"
                  >
                    <ion-icon :icon="phonePortraitOutline" />
                    <span>Mobile Money</span>
                    <ion-icon v-if="paymentMethod === 'mobile'" :icon="checkmarkCircleOutline" class="check" />
                  </div>
                </div>
              </div>
  
              <!-- Bouton valider -->
              <ion-button
                expand="block"
                class="btn-confirm-payment"
                @click="confirmPayment"
                :disabled="!paymentMethod || isPaying"
              >
                <ion-icon :icon="checkmarkCircleOutline" slot="start" />
                {{ isPaying ? 'Traitement...' : 'Confirmer le paiement' }}
              </ion-button>
            </div>
          </ion-content>
        </ion-modal>
  
        <!-- Loading -->
        <ion-loading
          :is-open="isPaying"
          message="Traitement du paiement..."
        />
  
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
  import {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonButtons, IonIcon, IonCard, IonCardHeader,
    IonCardTitle, IonCardSubtitle, IonCardContent, IonSpinner,
    IonModal, IonLoading, IonToast
  } from '@ionic/vue'
  import {
    timeOutline, calendarOutline, constructOutline, cardOutline,
    checkmarkCircleOutline, hammerOutline, hourglassOutline,
    cashOutline, phonePortraitOutline
  } from 'ionicons/icons'
  import { getCurrentUser } from '../services/auth.service'
  import { 
    getReparationsClient,
    getVoituresClient,
    updateReparationStatus
  } from '../services/firestore.service'
  
  const router = useRouter()
  const userInfo = ref<any>(null)
  const reparations = ref<any[]>([])
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
  
  onMounted(async () => {
    const user = getCurrentUser()
    if (user) {
      userInfo.value = user
      await loadReparations()
    } else {
      router.push('/login')
    }
  })
  
  const loadReparations = async () => {
    try {
      isLoading.value = true
      const userId = userInfo.value.id
      
      // Récupérer réparations et voitures
      const [reparationsData, voituresData] = await Promise.all([
        getReparationsClient(userId),
        getVoituresClient(userId)
      ])
      
      // Associer les infos de voiture à chaque réparation
      reparations.value = reparationsData.map(reparation => {
        const voiture = voituresData.find(v => v.id === reparation.id_voiture)
        // const voiture = voituresData.find((v: any) => v.id === reparation.id_voiture)
        return {
          ...reparation,
          voiture_info: voiture
        }
      })
    } catch (error) {
      console.error('Erreur chargement réparations:', error)
      toastMessage.value = 'Erreur de chargement'
      toastColor.value = 'danger'
      showToast.value = true
    } finally {
      isLoading.value = false
    }
  }
  
  const openPaymentModal = (reparation: any) => {
    selectedReparation.value = reparation
    paymentMethod.value = ''
    showPaymentModal.value = true
  }
  
  const confirmPayment = async () => {
    if (!paymentMethod.value || !selectedReparation.value) return
  
    try {
      isPaying.value = true
      
      // Mettre à jour le status à "payee"
      await updateReparationStatus(selectedReparation.value.id, 'payee')
      
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
  
  const getStatusClass = (status: string) => {
    const classes: any = {
      'en_attente': 'status-waiting',
      'en_cours': 'status-progress',
      'terminee': 'status-done',
      'payee': 'status-paid'
    }
    return classes[status] || ''
  }
  
  const getStatusIcon = (status: string) => {
    const icons: any = {
      'en_attente': hourglassOutline,
      'en_cours': constructOutline,
      'terminee': checkmarkCircleOutline,
      'payee': cashOutline
    }
    return icons[status] || timeOutline
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
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
  
  /* Header Section */
  .header-section {
    text-align: center;
    padding: 2rem 0;
    background: linear-gradient(135deg, rgba(255, 59, 48, 0.1) 0%, rgba(0, 0, 0, 0) 100%);
    border-radius: 16px;
    margin-bottom: 2rem;
  }
  
  .header-icon {
    font-size: 4rem;
    color: #FF3B30;
    margin-bottom: 1rem;
  }
  
  .header-section h2 {
    color: #FFFFFF;
    font-weight: 800;
    margin-bottom: 0.5rem;
  }
  
  .header-section p {
    color: #999;
    font-size: 0.9rem;
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
  
  /* Reparation Card */
  .reparation-card {
    background: #1a1a1a;
    border-radius: 16px;
    margin-bottom: 1rem;
    border: 1px solid #333;
  }
  
  .card-header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .reparation-card ion-card-title {
    color: #FFFFFF;
    font-weight: 700;
  }
  
  .reparation-card ion-card-subtitle {
    color: #999;
    font-size: 0.9rem;
  }
  
  /* Status Badge */
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.85rem;
    white-space: nowrap;
  }
  
  .status-waiting {
    background: rgba(255, 159, 10, 0.2);
    color: #FF9F0A;
  }
  
  .status-progress {
    background: rgba(10, 132, 255, 0.2);
    color: #0A84FF;
  }
  
  .status-done {
    background: rgba(48, 209, 88, 0.2);
    color: #30D158;
  }
  
  .status-paid {
    background: rgba(94, 92, 230, 0.2);
    color: #5E5CE6;
  }
  
  /* Content */
  .reparation-card ion-card-content {
    color: #CCCCCC;
  }
  
  .info-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #666;
    font-size: 0.85rem;
    margin-bottom: 1rem;
  }
  
  .info-row ion-icon {
    color: #FF3B30;
  }
  
  /* Interventions */
  .interventions-section {
    margin: 1rem 0;
  }
  
  .section-title {
    font-weight: 600;
    color: #FF3B30;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }
  
  .intervention-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: rgba(255, 59, 48, 0.1);
    border-radius: 8px;
    margin-bottom: 0.5rem;
  }
  
  .intervention-item ion-icon {
    color: #FF3B30;
    font-size: 1rem;
  }
  
  .intervention-item .prix {
    margin-left: auto;
    font-weight: 700;
    color: #FF3B30;
  }
  
  /* Total */
  .total-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: rgba(255, 59, 48, 0.2);
    border-radius: 8px;
    margin: 1rem 0;
  }
  
  .total-prix {
    font-size: 1.5rem;
    font-weight: 900;
    color: #FF3B30;
  }
  
  /* Buttons */
  .btn-pay {
    --background: #30D158;
    --border-radius: 12px;
    font-weight: bold;
    margin-top: 0.5rem;
  }
  
  /* Paid Badge */
  .paid-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    background: rgba(94, 92, 230, 0.2);
    border-radius: 12px;
    color: #5E5CE6;
    font-weight: 600;
    margin-top: 0.5rem;
  }
  
  .paid-badge ion-icon {
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
  
  /* Payment Modal */
  .payment-content {
    padding: 1rem 0;
  }
  
  .payment-summary {
    background: #1a1a1a;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .payment-summary h3 {
    color: #FFFFFF;
    margin-bottom: 1rem;
  }
  
  .summary-row {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 0;
    border-bottom: 1px solid #333;
  }
  
  .summary-row span {
    color: #999;
  }
  
  .summary-row strong {
    color: #FFFFFF;
  }
  
  .total-payment-row {
    display: flex;
    justify-content: space-between;
    padding: 1.5rem 0 0.5rem 0;
    font-size: 1.2rem;
  }
  
  .total-payment-row strong {
    color: #FFFFFF;
  }
  
  .amount {
    color: #FF3B30;
    font-weight: 900;
    font-size: 1.5rem;
  }
  
  /* Payment Methods */
  .payment-methods {
    margin-bottom: 2rem;
  }
  
  .payment-methods h3 {
    color: #FFFFFF;
    margin-bottom: 1rem;
  }
  
  .payment-options {
    display: grid;
    gap: 0.75rem;
  }
  
  .payment-option {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: #1a1a1a;
    border: 2px solid #333;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .payment-option:hover {
    border-color: #555;
  }
  
  .payment-option.selected {
    background: rgba(255, 59, 48, 0.2);
    border-color: #FF3B30;
  }
  
  .payment-option > ion-icon:first-child {
    font-size: 1.5rem;
    color: #FF3B30;
  }
  
  .payment-option span {
    flex: 1;
    color: #FFFFFF;
    font-weight: 600;
  }
  
  .payment-option .check {
    color: #30D158;
    font-size: 1.5rem;
  }
  
  /* Confirm Button */
  .btn-confirm-payment {
    --background: #30D158;
    --border-radius: 12px;
    font-weight: bold;
    height: 50px;
  }
  </style>