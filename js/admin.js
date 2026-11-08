// Page d'administration de la bêta : invités, et remise à zéro du monde. Réservée à l'administrateur (vérifié par le serveur).
import { api, onUser, login, logout } from './backend.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const app = $('app');

function porte(msg = '') {
  app.innerHTML = `<div class="carte"><h2>Administration</h2><p>Connecte-toi avec le compte administrateur.</p>
    ${msg ? `<p class="note">${esc(msg)}</p>` : ''}<button id="go" type="button">Se connecter avec Google</button></div>`;
  $('go').onclick = () => login().catch(() => porte('La connexion a échoué. Réessaie.'));
}

function page(user) {
  app.innerHTML = `
  <div class="carte"><h2>Administration</h2><p>${esc(user.email)}</p>
    <div class="ligne"><a href="jeu.html" style="flex:1"><button type="button" style="width:100%">Ouvrir le jeu</button></a>
    <button type="button" id="out" style="background:var(--bois-3);color:var(--texte)">Se déconnecter</button></div></div>

  <div class="carte"><h2>Invités</h2><p>Seules ces adresses Google peuvent entrer dans le jeu.</p>
    <form class="ligne" id="f-inv"><input id="inv" type="email" placeholder="adresse@gmail.com" required aria-label="Adresse e-mail"><button type="submit">Ajouter</button></form>
    <ul id="liste"><li>Chargement…</li></ul></div>

  <div class="carte danger"><h2>Bêta : recommencer à zéro</h2>
    <p>Efface le monde entier : toutes les guildes, leurs héros, leur or, les contrats, les territoires, les tournois. Les invités et les comptes restent ; chacun se reconnecte et fonde une nouvelle guilde.</p>
    <p><b>C'est définitif.</b> Pour confirmer, tape <b>RECOMMENCER</b>.</p>
    <input id="conf" autocomplete="off" aria-label="Tape RECOMMENCER pour confirmer">
    <button type="button" class="rouge" id="raz" disabled>Remettre le monde à zéro</button>
    <p class="note" id="bilan" role="status"></p></div>`;

  $('out').onclick = () => logout();
  const liste = $('liste');
  const charger = async () => {
    try {
      const { invites } = await api.listInvites();
      liste.innerHTML = invites.map((m) => `<li><span>${esc(m)}</span><button type="button" data-rm="${esc(m)}">Retirer</button></li>`).join('') || '<li>Aucun invité.</li>';
      liste.querySelectorAll('[data-rm]').forEach((b) => b.onclick = async () => {
        if (b.dataset.rm === user.email.toLowerCase()) return;
        await api.manageInvite({ email: b.dataset.rm, action: 'remove' }); charger();
      });
    } catch (e) { liste.innerHTML = `<li>${esc(e.message)}</li>`; }
  };
  $('f-inv').onsubmit = async (ev) => {
    ev.preventDefault();
    try { await api.manageInvite({ email: $('inv').value, action: 'add' }); $('inv').value = ''; charger(); }
    catch (e) { alert(e.message); }
  };
  $('conf').oninput = () => { $('raz').disabled = $('conf').value.trim().toUpperCase() !== 'RECOMMENCER'; };
  $('raz').onclick = async () => {
    $('raz').disabled = true; $('bilan').textContent = 'Remise à zéro en cours…';
    try {
      const r = await api.reinitialiser({ confirmation: $('conf').value });
      $('bilan').textContent = `C'est fait : ${r.guildes} guilde(s) effacée(s). Remise à zéro n° ${r.remisesAZero}. Le monde repart de maintenant.`;
      $('conf').value = '';
    } catch (e) { $('bilan').textContent = e.message; }
  };
  charger();
}

onUser(async (user) => {
  if (!user) { porte(); return; }
  try {
    const r = await api.enter();
    if (!r.admin) { app.innerHTML = '<div class="carte"><h2>Accès refusé</h2><p>Cette page est réservée à l’administrateur.</p><a href="jeu.html"><button type="button">Retour au jeu</button></a></div>'; return; }
    page(user);
  } catch (e) { porte(e.message); }
});
