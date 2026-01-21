<!-- src/views/Home.vue -->
<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
            <ion-title>Accueil - Garage Naka</ion-title>
            <ion-buttons slot="end">
                <ion-button @click="handleLogout">
                <ion-icon :icon="logOutOutline"></ion-icon>
                </ion-button>
            </ion-buttons>
            </ion-toolbar>
        </ion-header>
  
        <ion-content :fullscreen="true" class="ion-padding">
            <div class="welcome-section">
            <h1>Bienvenue {{ userName }} !</h1>
            <p>Vous êtes connecté avec succès</p>
    
            <div class="user-info">
                <ion-card>
                <ion-card-header>
                    <ion-card-title>Vos informations</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                    <p><strong>Nom :</strong> {{ userInfo?.nom }}</p>
                    <p><strong>Email :</strong> {{ userInfo?.email }}</p>
                    <p><strong>ID Client :</strong> {{ userInfo?.id_client }}</p>
                </ion-card-content>
                </ion-card>
            </div>
            </div>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
    import { ref, onMounted } from 'vue'
    import { useRouter } from 'vue-router'
    import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent
    } from '@ionic/vue'
    import { logOutOutline } from 'ionicons/icons'
    import { getCurrentUser, logout } from '../services/auth.service'

    const router = useRouter()
    const userInfo = ref<any>(null)
    const userName = ref('')

    onMounted(() => {
        const user = getCurrentUser()
        if (user) {
            userInfo.value = user
            userName.value = user.nom || user.email
        } else {
            // Si pas d'utilisateur connecté, rediriger vers login
            router.push('/login')
        }
    })

    const handleLogout = async () => {
        try {
            await logout()
            router.push('/login')
        } catch (error) {
            console.error('Logout error:', error)
        }
    }
</script>

<style scoped>
    .welcome-section {
    text-align: center;
    margin-top: 2rem;
    }

    .welcome-section h1 {
    color: #FF3B30;
    font-weight: 800;
    margin-bottom: 0.5rem;
    }

    .user-info {
    margin-top: 2rem;
    }

    ion-card {
    margin: 1rem auto;
    max-width: 500px;
    }
</style>