import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer, setDoc } from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with configured databaseId
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Ensure user is authenticated (using anonymous auth if available, non-blocking)
let currentUser: User | null = null;

export const initAuth = async (): Promise<User | null> => {
  try {
    return await new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), 1500);
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        clearTimeout(timer);
        unsubscribe();
        if (user) {
          currentUser = user;
          resolve(user);
        } else {
          try {
            const cred = await signInAnonymously(auth);
            currentUser = cred.user;
            resolve(cred.user);
          } catch {
            // Anonymous auth disabled in console; open firestore rules allow direct sync
            resolve(null);
          }
        }
      });
    });
  } catch {
    return null;
  }
};

// Connection tester mandated by guidelines
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'system_health', 'ping'));
    return true;
  } catch (error) {
    try {
      await setDoc(doc(db, 'system_health', 'ping'), {
        lastPing: new Date().toISOString(),
        status: 'online'
      });
      return true;
    } catch {
      return false;
    }
  }
}

