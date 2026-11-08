// Amorçage du jeu (jeu.html) : connexion, puis window.GL, que le script du jeu utilise pour lire et agir.
// Sans compte connecté, ou sans guilde, on renvoie vers l'accueil (index.html), qui gère l'invitation et la fondation.
import { api, onUser } from './backend.js';

const utilisateur = new Promise((ok) => { const stop = onUser((u) => { stop(); ok(u); }); });

window.GL = {
  async charger() {
    const u = await utilisateur;
    if (!u) { location.replace('index.html'); return new Promise(() => {}); }
    const r = await api.etat();
    if (!r.vue) { location.replace('index.html'); return new Promise(() => {}); }
    return r.vue;
  },
  agir: (donnees) => api.agir(donnees),
};
