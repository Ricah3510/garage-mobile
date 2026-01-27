<!-- src/views/Reparations.vue -->
<template>
    <ion-page>
      <ion-header>
        <ion-toolbar class="custom-toolbar">
          <ion-title>NOUVELLE RÉPARATION</ion-title>
        </ion-toolbar>
      </ion-header>
  
      <ion-content :fullscreen="true" class="ion-padding">
        
        <!-- Header -->
        <div class="header-section">
          <ion-icon :icon="constructOutline" class="header-icon" />
          <h2>Soumettre une réparation</h2>
          <p>Sélectionnez votre voiture et les interventions nécessaires</p>
        </div>
  
        <!-- Étape 1 : Sélection de la voiture -->
        <div class="step-section">
          <div class="step-header">
            <span class="step-number">1</span>
            <h3>Choisissez votre voiture</h3>
          </div>
  
          <!-- Loading voitures -->
          <div v-if="loadingVoitures" class="loading-box">
            <ion-spinner color="danger" />
            <p>Chargement des voitures...</p>
          </div>
  
          <!-- Liste des voitures -->
          <div v-else-if="voitures.length > 0" class="voitures-grid">
            <div
              v-for="voiture in voitures"
              :key="voiture.id"
              class="voiture-option"
              :class="{ 'selected': selectedVoiture?.id === voiture.id }"
              @click="selectVoiture(voiture)"
            >
              <ion-icon :icon="carSportOutline" />
              <div class="voiture-details">
                <strong>{{ voiture.modele }}</strong>
                <span>{{ voiture.immatriculation }}</span>
              </div>
              <ion-icon 
                v-if="selectedVoiture?.id === voiture.id" 
                :icon="checkmarkCircleOutline" 
                class="check-icon"
              />
            </div>
          </div>
  
          <!-- Aucune voiture -->
          <div v-else class="empty-box">
            <ion-icon :icon="carSportOutline" />
            <p>Aucune voiture enregistrée</p>
            <ion-button size="small" @click="$router.push('/ajout')">
              Ajouter une voiture
            </ion-button>
          </div>
        </div>
  
        <!-- Étape 2 : Sélection des interventions -->
        <div v-if="selectedVoiture" class="step-section">
          <div class="step-header">
            <span class="step-number">2</span>
            <h3>Sélectionnez les interventions</h3>
          </div>
  
          <!-- Loading interventions -->
          <div v-if="loadingInterventions" class="loading-box">
            <ion-spinner color="danger" />
            <p>Chargement des interventions...</p>
          </div>
  
          <!-- Liste des interventions -->
          <div v-else class="interventions-list">
            <div
              v-for="intervention in interventions"
              :key="intervention.id"
              class="intervention-card"
              :class="{ 'selected': selectedInterventions.includes(intervention.id) }"
              @click="toggleIntervention(intervention.id)"
            >
              <div class="intervention-header">
                <ion-checkbox
                  :checked="selectedInterventions.includes(intervention.id)"
                  @click.stop="toggleIntervention(intervention.id)"
                />
                <div class="intervention-info">
                  <strong>{{ intervention.nom }}</strong>
                  <span class="duration">
                    <ion-icon :icon="timeOutline" />
                    {{ Math.floor(intervention.duree_secondes / 60) }} min
                  </span>
                </div>
                <span class="prix">{{ intervention.prix }}€</span>
              </div>
            </div>
          </div>
        </div>
  
        <!-- Résumé et validation -->
        <div v-if="selectedVoiture && selectedInterventions.length > 0" class="summary-section">
          <div class="summary-card">
            <h3>📋 Récapitulatif</h3>
            
            <div class="summary-item">
              <ion-icon :icon="carSportOutline" />
              <div>
                <strong>{{ selectedVoiture.modele }}</strong>
                <span>{{ selectedVoiture.immatriculation }}</span>
              </div>
            </div>
  
            <div class="summary-item">
              <ion-icon :icon="listOutline" />
              <div>
                <strong>{{ selectedInterventions.length }} intervention(s)</strong>
                <span>{{ calculateDuration() }} min au total</span>
              </div>
            </div>
  
            <div class="total-row">
              <strong>TOTAL</strong>
              <span class="total-prix">{{ calculateTotal() }}€</span>
            </div>
  
            <ion-button
              expand="block"
              class="btn-submit"
              @click="submitReparation"
              :disabled="isSubmitting"
            >
              <ion-icon :icon="checkmarkCircleOutline" slot="start" />
              {{ isSubmitting ? 'Soumission...' : 'Soumettre la réparation' }}
            </ion-button>
          </div>
        </div>
  
        <!-- Info si pas de sélection -->
        <div v-else-if="selectedVoiture && selectedInterventions.length === 0" class="info-box">
          <ion-icon :icon="informationCircleOutline" />
          <p>Sélectionnez au moins une intervention pour continuer</p>
        </div>
  
        <!-- Loading -->
        <ion-loading
          :is-open="isSubmitting"
          message="Création de la réparation..."
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
  
  onMounted(async () => {
    const user = getCurrentUser()
    if (user) {
      userInfo.value = user
      await Promise.all([loadVoitures(), loadInterventions()])
    } else {
      router.push('/login')
    }
  })
  
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
      
      // Reset
      selectedVoiture.value = null
      selectedInterventions.value = []
      
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
  
  /* Step Section */
  .step-section {
    margin-bottom: 2rem;
  }
  
  .step-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .step-number {
    width: 36px;
    height: 36px;
    background: #FF3B30;
    color: #FFFFFF;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 1.2rem;
  }
  
  .step-header h3 {
    color: #FFFFFF;
    font-weight: 700;
    margin: 0;
  }
  
  /* Loading Box */
  .loading-box {
    text-align: center;
    padding: 2rem;
    background: #1a1a1a;
    border-radius: 12px;
  }
  
  .loading-box p {
    margin-top: 1rem;
    color: #666;
  }
  
  /* Voitures Grid */
  .voitures-grid {
    display: grid;
    gap: 1rem;
  }
  
  .voiture-option {
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
  
  .voiture-option:hover {
    border-color: #555;
  }
  
  .voiture-option.selected {
    background: rgba(255, 59, 48, 0.2);
    border-color: #FF3B30;
  }
  
  .voiture-option > ion-icon:first-child {
    font-size: 2rem;
    color: #FF3B30;
  }
  
  .voiture-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .voiture-details strong {
    color: #FFFFFF;
    font-size: 1rem;
  }
  
  .voiture-details span {
    color: #999;
    font-size: 0.85rem;
  }
  
  .check-icon {
    color: #30D158;
    font-size: 1.5rem;
  }
  
  /* Empty Box */
  .empty-box {
    text-align: center;
    padding: 2rem;
    background: #1a1a1a;
    border-radius: 12px;
    border: 2px dashed #333;
  }
  
  .empty-box ion-icon {
    font-size: 3rem;
    color: #333;
    margin-bottom: 1rem;
  }
  
  .empty-box p {
    color: #666;
    margin-bottom: 1rem;
  }
  
  /* Interventions List */
  .interventions-list {
    display: grid;
    gap: 0.75rem;
  }
  
  .intervention-card {
    background: #1a1a1a;
    border: 2px solid #333;
    border-radius: 12px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .intervention-card:hover {
    border-color: #555;
  }
  
  .intervention-card.selected {
    background: rgba(255, 59, 48, 0.2);
    border-color: #FF3B30;
  }
  
  .intervention-header {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .intervention-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .intervention-info strong {
    color: #FFFFFF;
    font-size: 1rem;
  }
  
  .duration {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    color: #999;
    font-size: 0.85rem;
  }
  
  .duration ion-icon {
    font-size: 1rem;
    color: #FF3B30;
  }
  
  .prix {
    color: #FF3B30;
    font-weight: 700;
    font-size: 1.1rem;
  }
  
  /* Summary Section */
  .summary-section {
    margin-top: 2rem;
  }
  
  .summary-card {
    background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
    border: 2px solid #FF3B30;
    border-radius: 16px;
    padding: 1.5rem;
  }
  
  .summary-card h3 {
    color: #FFFFFF;
    margin-bottom: 1rem;
    font-size: 1.2rem;
  }
  
  .summary-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 0;
    border-bottom: 1px solid #333;
  }
  
  .summary-item ion-icon {
    font-size: 1.5rem;
    color: #FF3B30;
  }
  
  .summary-item div {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .summary-item strong {
    color: #FFFFFF;
  }
  
  .summary-item span {
    color: #999;
    font-size: 0.85rem;
  }
  
  .total-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 0 1rem 0;
    font-size: 1.3rem;
  }
  
  .total-row strong {
    color: #FFFFFF;
  }
  
  .total-prix {
    color: #FF3B30;
    font-weight: 900;
  }
  
  .btn-submit {
    --background: #FF3B30;
    --border-radius: 12px;
    font-weight: bold;
    margin-top: 1rem;
    height: 50px;
  }
  
  /* Info Box */
  .info-box {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: rgba(255, 159, 10, 0.1);
    border: 1px solid rgba(255, 159, 10, 0.3);
    border-radius: 12px;
    color: #FF9F0A;
    margin-top: 1rem;
  }
  
  .info-box ion-icon {
    font-size: 1.5rem;
  }
  </style>