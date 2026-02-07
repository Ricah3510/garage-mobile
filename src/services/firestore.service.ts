// src/services/firestore.service.ts
import { db } from '../config/firebase'
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp

} from 'firebase/firestore'

/**
 * Récupérer un client par son firebase_uid
 */
export const getClient = async (firebaseUid: string) => {
  const docRef = doc(db, 'clients', firebaseUid)
  const docSnap = await getDoc(docRef)
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() }
  }
  return null
}

/**
 * Créer ou mettre à jour un client
 */
export const saveClient = async (firebaseUid: string, clientData: any) => {
  const docRef = doc(db, 'clients', firebaseUid)
  await setDoc(docRef, {
    ...clientData,
    date_creation: clientData.date_creation || Timestamp.now()
  }, { merge: true })
}

/**
 * Récupérer toutes les interventions
 */
export const getInterventions = async () => {
  const querySnapshot = await getDocs(collection(db, 'interventions'))
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

/**
 * Récupérer tous les slots
 */
export const getSlots = async () => {
  const querySnapshot = await getDocs(collection(db, 'slots'))
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

/**
 * Récupérer les voitures d'un client
 */
export const getVoituresClient = async (clientId: string) => {
  const q = query(collection(db, 'voitures'), where('id_client', '==', clientId))
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

/**
 * Créer une voiture
 */
export const createVoiture = async (voitureData: any) => {
  const docRef = await addDoc(collection(db, 'voitures'), {
    ...voitureData,
    date_creation: Timestamp.now()
  })
  return docRef.id
}

/**
 * Récupérer les réparations d'un client avec leur status actuel
 */
export const getReparationsClient = async (clientId: string) => {
  const q = query(
    collection(db, 'reparations'), 
    where('id_client', '==', clientId),
    orderBy('date_creation', 'desc')
  )
  const querySnapshot = await getDocs(q)
  
  // Pour chaque réparation, récupérer son status actuel
  const reparations = await Promise.all(
    querySnapshot.docs.map(async (docSnap) => {
      const reparation: any = { id: docSnap.id, ...docSnap.data() }
      
      // Récupérer le dernier status
      const statusQuery = query(
        collection(db, 'reparation_status'),
        where('id_reparation', '==', docSnap.id),
        orderBy('date_modification', 'desc')
      )
      const statusSnapshot = await getDocs(statusQuery)
      
      if (!statusSnapshot.empty) {
        const lastStatus: any = statusSnapshot.docs[0].data()
        reparation.status = lastStatus.status
        reparation.status_date = lastStatus.date_modification
      } else {
        reparation.status = 'en_attente'
      }
      
      return reparation
    })
  )
  
  return reparations
}

/**
 * Créer une réparation
 */
export const createReparation = async (reparationData: any) => {
  // Créer la réparation
  const docRef = await addDoc(collection(db, 'reparations'), {
    id_voiture: reparationData.id_voiture,
    id_client: reparationData.id_client,
    interventions: reparationData.interventions,
    montant_total: reparationData.montant_total,
    date_creation: Timestamp.now(),
    date_fin: null
  })
  
  // Créer le status initial
  await addDoc(collection(db, 'reparation_status'), {
    id_reparation: docRef.id,
    status: 'en_attente',
    date_modification: Timestamp.now()
  })
  
  return docRef.id
}

/**
 * Changer le status d'une réparation
 */
export const updateReparationStatus = async (reparationId: string, newStatus: string) => {
  // Ajouter un nouveau document dans reparation_status
  await addDoc(collection(db, 'reparation_status'), {
    id_reparation: reparationId,
    status: newStatus,
    date_modification: Timestamp.now()
  })
  
  // Si status = payee, mettre date_fin
  if (newStatus === 'payee') {
    const reparationRef = doc(db, 'reparations', reparationId)
    await updateDoc(reparationRef, {
      date_fin: Timestamp.now()
    })
  }
}

/**
 * Récupérer une réparation par son ID
 */
export const getReparation = async (reparationId: string) => {
  const docRef = doc(db, 'reparations', reparationId)
  const docSnap = await getDoc(docRef)
  
  if (docSnap.exists()) {
    const reparation: any = { id: docSnap.id, ...docSnap.data() }
    
    // Récupérer le status actuel
    const statusQuery = query(
      collection(db, 'reparation_status'),
      where('id_reparation', '==', reparationId),
      orderBy('date_modification', 'desc')
    )
    const statusSnapshot = await getDocs(statusQuery)
    
    if (!statusSnapshot.empty) {
      const lastStatus: any = statusSnapshot.docs[0].data()
      reparation.status = lastStatus.status
    }
    
    return reparation
  }
  return null
}



// Ajouter ces fonctions à firestore.service.ts

// import {
//   collection,
//   addDoc,
//   doc,
//   getDoc,
//   getDocs,
//   updateDoc,
//   query,
//   where,
//   orderBy,
//   Timestamp,
//   serverTimestamp
// } from 'firebase/firestore'
// import { db } from '../config/firebase'

/**
 * ═══════════════════════════════════════════════════════════
 * PAIEMENTS
 * ═══════════════════════════════════════════════════════════
 */

interface CreatePaiementData {
  id_reparation: string
  id_client: string
  montant: number
  mode_paiement: 'carte' | 'especes' | 'mobile'
  reference_transaction?: string
  notes?: string
}

/**
 * Créer un nouveau paiement
 */
export const createPaiement = async (data: CreatePaiementData) => {
  try {
    const paiementRef = await addDoc(collection(db, 'paiements'), {
      ...data,
      status: 'validee', // Par défaut validé immédiatement
      date_paiement: serverTimestamp()
    })

    console.log('✅ Paiement créé:', paiementRef.id)
    
    // Mettre à jour le statut de la réparation
    await updateReparationStatus(data.id_reparation, 'payee')
    
    return paiementRef.id
  } catch (error) {
    console.error('❌ Erreur création paiement:', error)
    throw error
  }
}

/**
 * Récupérer un paiement par ID
 */
export const getPaiement = async (paiementId: string) => {
  try {
    const paiementDoc = await getDoc(doc(db, 'paiements', paiementId))
    
    if (paiementDoc.exists()) {
      return {
        id: paiementDoc.id,
        ...paiementDoc.data()
      }
    }
    
    return null
  } catch (error) {
    console.error('❌ Erreur récupération paiement:', error)
    throw error
  }
}

/**
 * Récupérer tous les paiements d'un client
 */
export const getPaiementsClient = async (clientId: string) => {
  try {
    const q = query(
      collection(db, 'paiements'),
      where('id_client', '==', clientId),
      orderBy('date_paiement', 'desc')
    )
    
    const snapshot = await getDocs(q)
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('❌ Erreur récupération paiements client:', error)
    throw error
  }
}

/**
 * Récupérer le paiement d'une réparation
 */
export const getPaiementByReparation = async (reparationId: string) => {
  try {
    const q = query(
      collection(db, 'paiements'),
      where('id_reparation', '==', reparationId)
    )
    
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return null
    }
    
    const doc = snapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data()
    }
  } catch (error) {
    console.error('❌ Erreur récupération paiement réparation:', error)
    throw error
  }
}

/**
 * Annuler un paiement (remboursement)
 */
export const refundPaiement = async (paiementId: string, notes?: string) => {
  try {
    await updateDoc(doc(db, 'paiements', paiementId), {
      status: 'remboursee',
      notes: notes || 'Paiement remboursé'
    })
    
    console.log('✅ Paiement remboursé:', paiementId)
  } catch (error) {
    console.error('❌ Erreur remboursement paiement:', error)
    throw error
  }
}

/**
 * Récupérer les statistiques de paiement
 */
export const getPaiementStats = async (clientId?: string) => {
  try {
    let q
    
    if (clientId) {
      q = query(
        collection(db, 'paiements'),
        where('id_client', '==', clientId),
        where('status', '==', 'validee')
      )
    } else {
      q = query(
        collection(db, 'paiements'),
        where('status', '==', 'validee')
      )
    }
    
    const snapshot = await getDocs(q)
    
    const stats = {
      total_paiements: snapshot.size,
      montant_total: 0,
      par_mode: {
        carte: 0,
        especes: 0,
        mobile: 0
      }
    }
    
    snapshot.docs.forEach(doc => {
      const data = doc.data()
      stats.montant_total += data.montant
      stats.par_mode[data.mode_paiement as keyof typeof stats.par_mode]++
    })
    
    return stats
  } catch (error) {
    console.error('❌ Erreur récupération stats paiements:', error)
    throw error
  }
}