// src/config/firebase.ts
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getMessaging } from 'firebase/messaging'

const firebaseConfig = {
    apiKey: "AIzaSyCAxyLa0iv3Gt56pSCmPL1YoekTW7quAkc",
    authDomain: "garage-simulation.firebaseapp.com",
    projectId: "garage-simulation",
    storageBucket: "garage-simulation.firebasestorage.app",
    messagingSenderId: "258101790728",
    appId: "1:258101790728:web:5d66fdb7c61efd6cc5a9bd",
    measurementId: "G-4LYQ0WGQMY"
}

// Initialiser Firebase
const app = initializeApp(firebaseConfig)

// Initialiser Firebase Auth
export const auth = getAuth(app)

// Initialiser Firebase Messaging (pour les notifications)
export const messaging = getMessaging(app)

export default app