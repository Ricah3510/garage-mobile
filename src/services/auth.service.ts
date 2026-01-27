// src/services/auth.service.ts
import { auth } from '../config/firebase'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { getClient, saveClient } from './firestore.service'

export interface LoginResponse {
  success: boolean
  message: string
  data?: {
    client: any
    firebase_email: string
    firebase_uid: string
  }
  error?: string
}

/**
 * Connexion avec Firebase + Firestore
 */
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    // 1. Authentification avec Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    // 2. Récupérer le client depuis Firestore
    let client = await getClient(user.uid)
    
    // 3. Si le client n'existe pas, le créer
    if (!client) {
      const newClient = {
        nom: user.displayName || user.email?.split('@')[0] || 'Client',
        email: user.email,
        fcm_token: null
      }
      await saveClient(user.uid, newClient)
      client = await getClient(user.uid)
    }
    
    // 4. Stocker localement
    if (client) {
      localStorage.setItem('user', JSON.stringify(client))
      localStorage.setItem('firebase_uid', user.uid)
    }
    
    return {
      success: true,
      message: 'Login successful',
      data: {
        client,
        firebase_email: user.email || '',
        firebase_uid: user.uid
      }
    }
    
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
    localStorage.removeItem('firebase_uid')
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
  return !!localStorage.getItem('firebase_uid')
}