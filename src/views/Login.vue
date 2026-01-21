<!-- src/views/Login.vue  -->

<template>
  <ion-page>
    <ion-content :fullscreen="true">

      <!-- 🎬 SPLASH SCREEN -->
      <div v-if="showSplash" class="splash-screen">
        <div class="animation-container">
          <lottie-player
            src="/animations/Car_anim.json"
            background="transparent"
            speed="1"
          style="width: 300px; height: 300px"
            loop
            autoplay>
          </lottie-player>  
        </div>

        <h1 class="splash-title">GARAGE'NAKA</h1>
        <p class="splash-subtitle">Simulation de réparation</p>

        <div class="loading-bar-container">
          <div class="loading-bar"></div>
        </div>
      </div>

      <!-- 📱 LOGIN -->
      <div v-else class="login-page">
        <div class="login-container">

          <div class="login-card">
            <h2 class="login-title">Bienvenue</h2>
            <p class="login-subtitle">Chez Garage'naka</p>

            <!-- Email -->
            <div class="form-group">
              <label class="form-label">Email</label>
              <div class="input-wrapper">
                <ion-icon :icon="mailOutline" class="input-icon" />
                <ion-input
                  v-model="email"
                  type="email"
                  placeholder="votre@email.com"
                  class="custom-input"
                />
              </div>
            </div>

            <!-- Password -->
            <div class="form-group">
              <label class="form-label">Mot de passe</label>
              <div class="input-wrapper">
                <ion-icon :icon="lockClosedOutline" class="input-icon" />
                <ion-input
                  v-model="password"
                  type="password"
                  placeholder="••••••••"
                  class="custom-input"
                />
              </div>
            </div>

            <ion-button expand="block" class="btn-login" @click="handleLogin">
              Se connecter
            </ion-button>

            <!-- Divider -->
            <div class="divider">
              <span class="divider-text">Ou continuer avec</span>
            </div>

            <!-- Boutons sociaux -->
            <div class="social-buttons">
              <ion-button fill="outline" class="social-btn">
                <ion-icon :icon="logoGithub"></ion-icon>
              </ion-button>
              <ion-button fill="outline" class="social-btn">
                <ion-icon :icon="logoGoogle"></ion-icon>
              </ion-button>
              <ion-button fill="outline" class="social-btn">
                <ion-icon :icon="hammerOutline"></ion-icon>
              </ion-button>
            </div>

            <!-- Lien d'inscription -->
            <p class="signup-text">
              Pas encore de compte ?
              <a href="#" class="signup-link">S'inscrire</a>
            </p>

          </div>
        </div>
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { IonPage, IonContent, IonInput, IonButton, IonIcon, IonLoading, IonToast } from '@ionic/vue'
  import { mailOutline, lockClosedOutline, logoGithub, logoGoogle, hammerOutline } from 'ionicons/icons'
  import { login } from '@/services/auth.service'
  
  const router = useRouter()
  
  const showSplash = ref(true)
  const email = ref('')
  const password = ref('')
  const isLoading = ref(false)
  const showToast = ref(false)
  const toastMessage = ref('')
  const toastColor = ref('danger')
  
  // Durée du splash screen
  onMounted(() => {
    setTimeout(() => {
      showSplash.value = false
    }, 4000) // 4 secondes
  })
  
  const handleLogin = async () => {
    // Validation
    if (!email.value || !password.value) {
      toastMessage.value = 'Veuillez remplir tous les champs'
      toastColor.value = 'warning'
      showToast.value = true
      return
    }
  
    isLoading.value = true
  
    try {
      // Appel du service d'authentification
      const result = await login(email.value, password.value)
  
      if (result.success) {
        toastMessage.value = 'Connexion réussie !'
        toastColor.value = 'success'
        showToast.value = true
  
        // Redirection après 1 seconde
        setTimeout(() => {
          router.push('/home') // On créera cette page plus tard
        }, 1000)
      } else {
        toastMessage.value = result.message
        toastColor.value = 'danger'
        showToast.value = true
      }
    } catch (error) {
      toastMessage.value = 'Erreur de connexion'
      toastColor.value = 'danger'
      showToast.value = true
      console.error('Login error:', error)
    } finally {
      isLoading.value = false
    }
  }
  </script>

<style scoped>
/* 🎬 SPLASH SCREEN */
.splash-screen {
  height: 100vh;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.animation-container {
  margin-bottom: 1.5rem;
}

.splash-title {
  font-size: 2.5rem;
  font-weight: 900;
  color: #FF3B30; /* rouge dynamique */
  text-align: center;
}

.splash-subtitle {
  color: #000000;
  margin-bottom: 2rem;
  text-align: center;
}

.loading-bar-container {
  width: 200px;
  height: 4px;
  background: #000000;
  border-radius: 2px;
  overflow: hidden;
}

.loading-bar {
  height: 100%;
  width: 100%;
  background: #FF3B30;
  animation: loading 4s linear forwards;
}

@keyframes loading {
  from { width: 0 }
  to { width: 100% }
}

/* 📱 LOGIN PAGE */
.login-page {
  min-height: 100vh;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-container {
  width: 100%;
  max-width: 400px;
  padding: 1rem;
}

.login-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.login-title {
  text-align: center;
  font-weight: 800;
  font-size: 2rem;
  color: #FF3B30; /* rouge dynamique */
  margin-bottom: 0.3rem;
}

.login-subtitle {
  text-align: center;
  color: #000000;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #000000;
  margin-bottom: 0.3rem;
  display: block;
}

.input-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #000000;
}

.custom-input {
  --background: #ffffff;
  --padding-start: 36px;
  border: 1px solid #000000;
  border-radius: 12px;
  color: #000000;
}

.btn-login {
  margin-top: 1rem;
  --background: #FF3B30;
  --border-radius: 12px;
  font-weight: bold;
  color: white;
}

/* Divider */
.divider {
  display: flex;
  align-items: center;
  margin: 1.5rem 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #000000;
}

.divider-text {
  padding: 0 1rem;
  font-size: 0.875rem;
  color: #000000;
  font-weight: 600;
}

/* Social Buttons */
.social-buttons {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.social-btn {
  flex: 1;
  margin: 0 0.25rem;
  --border-radius: 12px;
  --border-width: 1.5px;
  --border-color: #000000;
  --color: #000000;
}

.social-btn:hover {
  --border-color: #FF3B30;
  --background: #ffe5e5;
}

/* Signup Link */
.signup-text {
  text-align: center;
  margin-top: 0.5rem;
  color: #000000;
}

.signup-link {
  color: #FF3B30;
  font-weight: 600;
  text-decoration: none;
}

.signup-link:hover {
  color: #000000;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0 }
  to { opacity: 1 }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
