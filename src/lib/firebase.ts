
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration - using Supabase project details
const firebaseConfig = {
  apiKey: "AIzaSyC8Q7K5K5K5K5K5K5K5K5K5K5K5K5K5K5K",
  authDomain: "qovgcumafbauktwthurx.firebaseapp.com",
  projectId: "qovgcumafbauktwthurx",
  storageBucket: "qovgcumafbauktwthurx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
