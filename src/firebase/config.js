import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyD5YmdYcrKVb4IWHoZfPOkrpKTPubJqKpY",
  authDomain: "sblocchi-produzione.firebaseapp.com",
  projectId: "sblocchi-produzione",
  storageBucket: "sblocchi-produzione.firebasestorage.app",
  messagingSenderId: "389036228451",
  appId: "1:389036228451:web:82d674c8cce8e428f41d56"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)
