<!-- src/views/Ajout.vue -->
<template>
    <ion-page>
      <ion-header>
        <ion-toolbar class="custom-toolbar">
          <ion-buttons slot="start">
            <ion-button @click="$router.back()">
              <ion-icon :icon="arrowBackOutline" />
            </ion-button>
          </ion-buttons>
          <ion-title>AJOUTER VOITURE</ion-title>
        </ion-toolbar>
      </ion-header>
  
      <ion-content :fullscreen="true" class="ion-padding">
        
        <!-- Illustration -->
        <div class="header-illustration">
          <ion-icon :icon="carSportOutline" class="big-car-icon" />
          <h2>Nouvelle Voiture</h2>
          <p>Ajoutez les informations de votre véhicule</p>
        </div>
  
        <!-- Formulaire -->
        <div class="form-container">
          
          <!-- Modèle -->
          <div class="form-group">
            <label class="form-label">
              <ion-icon :icon="carOutline" />
              Modèle du véhicule
            </label>
            <div class="input-wrapper">
              <ion-input
                v-model="modele"
                placeholder="Ex: Toyota Corolla, Renault Clio..."
                class="custom-input"
                :class="{ 'input-error': errors.modele }"
              />
            </div>
            <p v-if="errors.modele" class="error-message">{{ errors.modele }}</p>
          </div>
  
          <!-- Immatriculation -->
          <div class="form-group">
            <label class="form-label">
              <ion-icon :icon="documentTextOutline" />
              Immatriculation
            </label>
            <div class="input-wrapper">
              <ion-input
                v-model="immatriculation"
                placeholder="Ex: 1234 ABC"
                class="custom-input"
                :class="{ 'input-error': errors.immatriculation }"
                @ionInput="formatImmatriculation"
              />
            </div>
            <p v-if="errors.immatriculation" class="error-message">{{ errors.immatriculation }}</p>
          </div>
  
          <!-- Boutons -->
          <div class="buttons-container">
            <ion-button 
              expand="block" 
              class="btn-submit"
              @click="handleSubmit"
              :disabled="isSubmitting"
            >
              <ion-icon :icon="checkmarkCircleOutline" slot="start" />
              {{ isSubmitting ? 'Enregistrement...' : 'Enregistrer la voiture' }}
            </ion-button>
  
            <ion-button 
              expand="block" 
              fill="outline"
              class="btn-cancel"
              @click="$router.back()"
              :disabled="isSubmitting"
            >
              <ion-icon :icon="closeCircleOutline" slot="start" />
              Annuler
            </ion-button>
          </div>
  
          <!-- Info Box -->
          <div class="info-box">
            <ion-icon :icon="informationCircleOutline" />
            <div>
              <p><strong>Note :</strong> Vérifiez bien l'immatriculation avant de valider.</p>
            </div>
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
  
        <!-- Loading -->
        <ion-loading
          :is-open="isSubmitting"
          message="Enregistrement en cours..."
        />
      </ion-content>
    </ion-page>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonButtons, IonIcon, IonInput, IonToast, IonLoading
  } from '@ionic/vue'
  import {
    arrowBackOutline, carSportOutline, carOutline,
    documentTextOutline, checkmarkCircleOutline,
    closeCircleOutline, informationCircleOutline
  } from 'ionicons/icons'
  import { getCurrentUser } from '../services/auth.service'
  import { createVoiture } from '../services/firestore.service'
  
  const router = useRouter()
  
  const modele = ref('')
  const immatriculation = ref('')
  const errors = ref<any>({})
  const isSubmitting = ref(false)
  
  // Toast
  const showToast = ref(false)
  const toastMessage = ref('')
  const toastColor = ref('success')
  
  const formatImmatriculation = (event: any) => {
    // Convertir en majuscules automatiquement
    let value = event.target.value.toUpperCase()
    immatriculation.value = value
  }
  
  const validate = () => {
    errors.value = {}
    let isValid = true
  
    // Validation modèle
    if (!modele.value.trim()) {
      errors.value.modele = 'Le modèle est obligatoire'
      isValid = false
    } else if (modele.value.trim().length < 3) {
      errors.value.modele = 'Le modèle doit contenir au moins 3 caractères'
      isValid = false
    }
  
    // Validation immatriculation
    if (!immatriculation.value.trim()) {
      errors.value.immatriculation = 'L\'immatriculation est obligatoire'
      isValid = false
    } else if (immatriculation.value.trim().length < 4) {
      errors.value.immatriculation = 'L\'immatriculation doit contenir au moins 4 caractères'
      isValid = false
    }
  
    return isValid
  }
  
  const handleSubmit = async () => {
    if (!validate()) {
      toastMessage.value = 'Veuillez corriger les erreurs'
      toastColor.value = 'warning'
      showToast.value = true
      return
    }
  
    try {
      isSubmitting.value = true
  
      const user = getCurrentUser()
      if (!user) {
        router.push('/login')
        return
      }
  
      // Créer la voiture
      await createVoiture({
        modele: modele.value.trim(),
        immatriculation: immatriculation.value.trim().toUpperCase(),
        id_client: user.id
      })
  
      toastMessage.value = '🚗 Voiture ajoutée avec succès !'
      toastColor.value = 'success'
      showToast.value = true
  
      // Rediriger après 1.5 secondes
      setTimeout(() => {
        router.push('/home')
      }, 1500)
  
    } catch (error) {
      console.error('Erreur ajout voiture:', error)
      toastMessage.value = 'Erreur lors de l\'ajout de la voiture'
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
  
  /* Header Illustration */
  .header-illustration {
    text-align: center;
    padding: 2rem 0;
    background: linear-gradient(135deg, rgba(255, 59, 48, 0.1) 0%, rgba(0, 0, 0, 0) 100%);
    border-radius: 16px;
    margin-bottom: 2rem;
  }
  
  .big-car-icon {
    font-size: 5rem;
    color: #FF3B30;
    margin-bottom: 1rem;
  }
  
  .header-illustration h2 {
    color: #FFFFFF;
    font-weight: 800;
    margin-bottom: 0.5rem;
  }
  
  .header-illustration p {
    color: #999;
  }
  
  /* Form Container */
  .form-container {
    max-width: 500px;
    margin: 0 auto;
  }
  
  /* Form Group */
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  .form-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    font-weight: 600;
    color: #FF3B30;
    margin-bottom: 0.5rem;
  }
  
  .form-label ion-icon {
    font-size: 1.2rem;
  }
  
  /* Input */
  .input-wrapper {
    position: relative;
  }
  
  .custom-input {
    --background: #1a1a1a;
    --color: #FFFFFF;
    --padding-start: 16px;
    --padding-end: 16px;
    border: 2px solid #333;
    border-radius: 12px;
    font-size: 1rem;
    transition: all 0.3s ease;
  }
  
  .custom-input:focus-within {
    --background: #222;
    border-color: #FF3B30;
  }
  
  .input-error {
    border-color: #FF453A !important;
  }
  
  .error-message {
    color: #FF453A;
    font-size: 0.85rem;
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }
  
  /* Buttons */
  .buttons-container {
    margin-top: 2rem;
  }
  
  .btn-submit {
    --background: #FF3B30;
    --border-radius: 12px;
    font-weight: bold;
    margin-bottom: 1rem;
    height: 50px;
  }
  
  .btn-submit:hover {
    --background: #E5342A;
  }
  
  .btn-cancel {
    --border-color: #666;
    --color: #999;
    --border-radius: 12px;
    font-weight: 600;
    height: 50px;
  }
  
  .btn-cancel:hover {
    --border-color: #999;
    --color: #CCC;
  }
  
  /* Info Box */
  .info-box {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: rgba(10, 132, 255, 0.1);
    border: 1px solid rgba(10, 132, 255, 0.3);
    border-radius: 12px;
    margin-top: 2rem;
    color: #0A84FF;
  }
  
  .info-box ion-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }
  
  .info-box p {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.5;
  }
  
  .info-box strong {
    color: #FFFFFF;
  }
  </style>
  