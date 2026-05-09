export function initializeApp() { return {}; }
export function getApps() { return [{}]; }
export type FirebaseApp = any;

export const firebase = { app: {}, auth: {}, db: {}, storage: {}, functions: {} };
export const firebaseAuth = {};
export const firebaseDb = {};
export const firebaseStorage = {};
export const firebaseFunctions = {};

export const projectId = 'calico-supabase';
export const publicAnonKey = 'anon-key';
export const isFirebaseDemoMode = false;

export function initializeFirebase() {
  return { app: {}, auth: {}, db: {}, storage: {}, functions: {} };
}