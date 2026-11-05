import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { ExhibitionProject } from '../types/exhibition';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDab0FbQKNH-mT52--jArXlEkFP9cpXYnc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "kimanaexpo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "kimanaexpo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "kimanaexpo.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "423361085578",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:423361085578:web:be1f58d9b42c4702d5ed73",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-PH5WRLTHGH"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);

export const SHARED_PROJECT_DOC_ID = 'spaguetty_house_shared_project';

/**
 * Suscribe a todos los clientes al documento compartido en Firestore.
 * Cuando un usuario hace un cambio, todos los demás reciben la actualización en tiempo real.
 */
export function subscribeToSharedProject(
  onRemoteUpdate: (project: ExhibitionProject) => void,
  onError?: (err: Error) => void
) {
  const projectRef = doc(db, 'projects', SHARED_PROJECT_DOC_ID);

  return onSnapshot(
    projectRef,
    { includeMetadataChanges: true },
    (snapshot) => {
      // Ignorar escrituras pendientes del cliente local para evitar loops de re-render
      if (snapshot.metadata.hasPendingWrites) {
        return;
      }
      if (snapshot.exists()) {
        const remoteData = snapshot.data() as ExhibitionProject;
        onRemoteUpdate(remoteData);
      }
    },
    (err) => {
      console.warn('Firestore sync listener notice:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Guarda el proyecto en Firestore y lo persiste localmente en caso de fallo.
 */
export async function saveProjectToFirestore(project: ExhibitionProject): Promise<void> {
  const projectRef = doc(db, 'projects', SHARED_PROJECT_DOC_ID);
  const cleanData = JSON.parse(JSON.stringify(project));
  
  // Verificación de tamaño para prevenir el error de 1MB de Firestore
  const serialized = JSON.stringify(cleanData);
  const approximateSizeBytes = new Blob([serialized]).size;
  if (approximateSizeBytes > 1048576) {
    const mb = (approximateSizeBytes / (1024 * 1024)).toFixed(2);
    console.error(`El proyecto pesa ${mb} MB y excede el límite de 1 MB por documento de Firestore.`);
    throw new Error(`Tamaño excedido (${mb} MB). La imagen subida debe comprimirse.`);
  }

  await setDoc(projectRef, cleanData);
}

/**
 * Carga inicial única desde Firestore (útil para la primera carga antes del listener).
 */
export async function loadInitialProjectFromFirestore(): Promise<ExhibitionProject | null> {
  try {
    const projectRef = doc(db, 'projects', SHARED_PROJECT_DOC_ID);
    const snap = await getDoc(projectRef);
    if (snap.exists()) {
      return snap.data() as ExhibitionProject;
    }
    return null;
  } catch (err) {
    console.warn('Could not load initial project from Firestore, will fallback:', err);
    return null;
  }
}
