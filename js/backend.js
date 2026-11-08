// Accès à Firebase : connexion, appels serveur, lectures en temps réel.
// Le navigateur ne fait que lire ; toute écriture de jeu passe par une fonction serveur.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithCredential, signOut, onAuthStateChanged, connectAuthEmulator,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import {
  getFirestore, doc, collection, query, orderBy, limit, onSnapshot, connectFirestoreEmulator,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-functions.js';
import { FIREBASE_CONFIG, REGION, USE_EMULATORS } from './config.js';

const app = initializeApp(USE_EMULATORS ? { ...FIREBASE_CONFIG, projectId: 'demo-guild-of-legends', apiKey: 'demo' } : FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);
const fns = getFunctions(app, REGION);

if (USE_EMULATORS) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectFunctionsEmulator(fns, '127.0.0.1', 5001);
  // Connexion de test, uniquement avec les émulateurs.
  window.__testSignIn = (email) => signInWithCredential(auth,
    GoogleAuthProvider.credential(JSON.stringify({ sub: email, email, email_verified: true, name: email.split('@')[0] })));
}

const call = (name) => async (data) => {
  try { return (await httpsCallable(fns, name)(data)).data; }
  catch (e) { throw new Error(e.message || 'Le serveur n’a pas répondu.'); }
};

export const api = {
  enter: call('enter'),
  createGuild: call('createGuild'),
  manageInvite: call('manageInvite'),
  listInvites: call('listInvites'),
  reinitialiser: call('reinitialiser'),
  etat: call('etat'),
  agir: call('agir'),
};

export function onUser(cb) { return onAuthStateChanged(auth, cb); }
export function login() { return signInWithPopup(auth, new GoogleAuthProvider()); }
export function logout() { return signOut(auth); }

export function watchGuild(guildId, cb, onErr) {
  return onSnapshot(doc(db, 'guilds', guildId), (s) => cb(s.exists() ? { id: s.id, ...s.data() } : null), onErr);
}
export function watchJournal(guildId, max, cb, onErr) {
  const q = query(collection(db, 'guilds', guildId, 'journal'), orderBy('at', 'desc'), limit(max));
  return onSnapshot(q, (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))), onErr);
}
