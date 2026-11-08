// Configuration Firebase du projet Guild Legends.
// À remplacer par les valeurs de la console Firebase › Paramètres du projet › Vos applications › Config.
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAtpie4-hSm5C_Frp_PfzsCqV8pkkV0prg',
  authDomain: 'guild-of-legends-c7f66.firebaseapp.com',
  projectId: 'guild-of-legends-c7f66',
  appId: '1:846141453929:web:5a84c00eab501b0c8ed4f8',
};

export const REGION = 'europe-west1';
export const VERSION = 'M1 · 1';

// En local (localhost), l'appli parle aux émulateurs Firebase au lieu du vrai projet.
export const USE_EMULATORS = ['localhost', '127.0.0.1'].includes(location.hostname);
