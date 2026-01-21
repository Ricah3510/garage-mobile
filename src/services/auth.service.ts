// src/services/auth.service.ts
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '../config/firebase'

const API_URL = 'https://garage-api-wtfw.onrender.com/api'
// const API_URL = 'http://192.168.88.139:8000/api'


export interface LoginResponse {
    success: boolean
    message: string
    data?: {
        client: {
        id_client: number
        nom: string
        email: string
        firebase_uid: string
        date_creation: string
        }
        firebase_email: string
        firebase_uid: string
    }
    error?: string
}

/**
 * Connexion avec Firebase puis Laravel
 */
export const login = async (email: string, password: string): Promise<LoginResponse> => {
    try {
        // 1. Authentification avec Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        const user = userCredential.user
        
        // 2. Récupérer le token Firebase
        const firebaseToken = await user.getIdToken()
        
        // 3. Envoyer le token à Laravel
        const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            firebase_token: firebaseToken,
            fcm_token: null // On gérera les notifications plus tard
        })
        })
        
        const data: LoginResponse = await response.json()
        
        if (!response.ok) {
        throw new Error(data.message || 'Authentication failed')
        }
        
        // 4. Stocker les données du client localement
        if (data.success && data.data) {
        localStorage.setItem('user', JSON.stringify(data.data.client))
        localStorage.setItem('firebase_token', firebaseToken)
        }
        
        return data
        
    } catch (error: any) {
        console.error('Login error:', error)
        return {
        success: false,
        message: error.message || 'Une erreur est survenue',
        error: error.code || 'unknown_error'
        }
    }
}

/**
 * Déconnexion
 */
export const logout = async (): Promise<void> => {
    try {
        await signOut(auth)
        localStorage.removeItem('user')
        localStorage.removeItem('firebase_token')
    } catch (error) {
        console.error('Logout error:', error)
        throw error
    }
}

/**
 * Récupérer l'utilisateur stocké localement
 */
export const getCurrentUser = () => {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
}

/**
 * Vérifier si l'utilisateur est connecté
 */
export const isAuthenticated = (): boolean => {
    return !!localStorage.getItem('firebase_token')
}