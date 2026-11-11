import { api, onUser, login, logout, watchGuild, watchJournal } from './backend.js';
import { SHAPES, COLORS, emblemSvg } from './emblems.js';
import { VERSION } from './config.js';
import { REGIONS, REGIONS_OUVERTES } from './regions.js';

const $app = document.getElementById('app');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const state = { user: null, admin: false, guildId: null, guild: null, journal: [], tab: 'repere', unsub: [] };

/* ---------- Utilitaires ---------- */
function toast(msg) {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div');
  t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
  document.body.append(t);
  setTimeout(() => t.remove(), 3500);
}

function quand(ts) {
  const d = ts?.toDate ? ts.toDate() : null;
  if (!d) return 'à l’instant';
  const now = new Date();
  const jour = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const ecart = Math.round((jour(now) - jour(d)) / 86400000);
  const h = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', ' h ');
  if (ecart === 0) return `Auj. ${h}`;
  if (ecart === 1) return `Hier ${h}`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function texteJournal(e) {
  if (e.text) return e.text;
  return { recruit: 'Un nouveau héros a rejoint le repère.', replaced: 'Un héros a quitté le repère.' }[e.type] || 'Un événement a eu lieu.';
}

function stopListeners() { state.unsub.forEach((u) => u()); state.unsub = []; }

/* ---------- Écrans ---------- */
function ecranChargement(msg = 'On allume les lanternes…') {
  $app.innerHTML = `<div class="chargement" role="status">${esc(msg)}</div>`;
}

function ecranPorte(erreur = '') {
  $app.innerHTML = `
  <main class="ecran sans-nav porte">
    <svg class="lanterne" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true">${SHAPES.lanterne.d}</svg>
    <h1>Guild Legends</h1>
    <p>Quelque part dans Runeterra, une porte entrouverte et une lumière allumée. Ton repère t’attend.</p>
    ${erreur ? `<div class="erreur" role="alert" style="color:#f6e7cf">${esc(erreur)}</div>` : ''}
    <button class="bouton" id="btn-login" type="button">Entrer avec Google</button>
    <div class="version">${esc(VERSION)}</div>
  </main>`;
  document.getElementById('btn-login').onclick = async () => {
    try { await login(); } catch (e) { if (e.code !== 'auth/popup-closed-by-user') ecranPorte('La connexion a échoué. Réessaie.'); }
  };
}

function ecranFondation() {
  const choix = { shape: 'lanterne', color: 'ambre', region: null, title: 'maître' };
  $app.innerHTML = `
  <main class="ecran sans-nav">
    <form class="parchemin" id="form-fondation" novalidate>
      <h1>Fonder ta guilde</h1>
      <p>Chaque légende commence par un nom cloué au-dessus d’une porte. Choisis bien : il te suivra jusqu’au bout.</p>
      <div class="champ">
        <label for="f-nom">Nom de la guilde</label>
        <input id="f-nom" name="nom" maxlength="32" autocomplete="off" required>
        <span class="aide">3 à 32 caractères. Il doit être unique.</span>
      </div>
      <div class="champ">
        <label for="f-devise">Devise <span style="font-weight:400">(facultative)</span></label>
        <textarea id="f-devise" name="devise" maxlength="120"></textarea>
      </div>
      <fieldset class="champ">
        <legend>Région du repère</legend>
        <div class="choix regions" id="c-region">
          ${Object.entries(REGIONS).sort(([a], [b]) => REGIONS_OUVERTES.includes(b) - REGIONS_OUVERTES.includes(a)).map(([k, nom]) => REGIONS_OUVERTES.includes(k)
            ? `<button type="button" data-v="${k}" aria-pressed="false">${esc(nom)}</button>`
            : `<button type="button" disabled aria-disabled="true" title="Bientôt ouverte">${esc(nom)}<small>bientôt</small></button>`).join('')}
        </div>
        <span class="aide">Ce choix est définitif. La proximité compte pour attirer les commanditaires de missions. Les régions grisées ouvriront quand leurs missions seront écrites.</span>
      </fieldset>
      <fieldset class="champ">
        <legend>Emblème</legend>
        <div class="choix" id="c-forme">
          ${Object.entries(SHAPES).map(([k, s]) => `<button type="button" data-v="${k}" aria-label="${esc(s.nom)}" aria-pressed="${k === choix.shape}">${emblemSvg(k)}</button>`).join('')}
        </div>
      </fieldset>
      <fieldset class="champ">
        <legend>Couleur</legend>
        <div class="choix couleurs" id="c-couleur">
          ${Object.entries(COLORS).map(([k, c]) => `<button type="button" data-v="${k}" aria-label="${esc(c.nom)}" aria-pressed="${k === choix.color}"><span style="--c:${c.hex}"></span></button>`).join('')}
        </div>
      </fieldset>
      <fieldset class="champ">
        <legend>On t'appellera</legend>
        <div class="choix" id="c-titre">
          <button type="button" data-v="maître" aria-pressed="true">Maître</button>
          <button type="button" data-v="maîtresse" aria-pressed="false">Maîtresse</button>
        </div>
        <span class="aide">Tes héros t'écrivent et te parlent : ils accorderont tout à ce titre.</span>
        <div style="display:flex;align-items:center;gap:10px;margin-top:10px">
          <label for="f-maitre" id="f-titre-nom" style="font-weight:700;white-space:nowrap">Maître</label>
          <input id="f-maitre" maxlength="20" autocomplete="off" placeholder="ton nom" style="flex:1;min-width:0">
        </div>
        <span class="aide">Le nom qui suit ton titre. Facultatif, et tu pourras le changer.</span>
      </fieldset>
      <div class="champ">
        <label for="f-chien">Le nom du chien du repère</label>
        <input id="f-chien" maxlength="20" autocomplete="off" placeholder="Gamelle">
        <span class="aide">Il vit au repère, console les blessés et vole dans les gamelles. Tu pourras le renommer.</span>
      </div>
      <label class="champ" style="display:flex;gap:10px;align-items:flex-start">
        <input type="checkbox" id="f-doux" checked style="margin-top:4px">
        <span>Accepter les billets doux<br><span class="aide">Quelques héros adultes, bien choisis, peuvent flirter avec toi par écrit, de temps en temps. Tu peux refuser.</span></span>
      </label>
      <div style="display:flex;align-items:center;gap:14px">
        <div class="medaillon" id="apercu" style="--c:${COLORS[choix.color].hex}">${emblemSvg(choix.shape)}</div>
        <span class="aide">Aperçu de ton enseigne</span>
      </div>
      <div id="f-erreur"></div>
      <button class="bouton" type="submit" id="f-ok">Ouvrir le repère</button>
    </form>
  </main>`;

  const apercu = document.getElementById('apercu');
  const majApercu = () => { apercu.style.setProperty('--c', COLORS[choix.color].hex); apercu.innerHTML = emblemSvg(choix.shape); };
  const groupe = (id, cle) => {
    const g = document.getElementById(id);
    g.addEventListener('click', (ev) => {
      const b = ev.target.closest('button'); if (!b || b.disabled) return;
      choix[cle] = b.dataset.v;
      g.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b));
      majApercu();
    });
  };
  groupe('c-forme', 'shape'); groupe('c-couleur', 'color'); groupe('c-region', 'region'); groupe('c-titre', 'title');
  document.getElementById('c-titre').addEventListener('click', () => { document.getElementById('f-titre-nom').textContent = choix.title === 'maîtresse' ? 'Maîtresse' : 'Maître'; });
  document.getElementById('f-nom').addEventListener('input', () => { document.getElementById('f-erreur').innerHTML = ''; });

  document.getElementById('form-fondation').onsubmit = async (ev) => {
    ev.preventDefault();
    const ok = document.getElementById('f-ok');
    const err = document.getElementById('f-erreur');
    err.innerHTML = '';
    ok.disabled = true; ok.textContent = 'On cloue l’enseigne…';
    try {
      const r = await api.createGuild({
        name: document.getElementById('f-nom').value,
        motto: document.getElementById('f-devise').value,
        emblem: { shape: choix.shape, color: choix.color },
        region: choix.region,
        title: choix.title,
        masterName: document.getElementById('f-maitre').value,
        dog: document.getElementById('f-chien').value,
        flirt: document.getElementById('f-doux').checked,
      });
      state.guildId = r.guildId;
      location.href = 'jeu.html';
    } catch (e) {
      err.innerHTML = `<div class="erreur" role="alert">${esc(e.message)}</div>`;
      ok.disabled = false; ok.textContent = 'Ouvrir le repère';
    }
  };
}

const NAV = [
  { id: 'repere', nom: 'Repère', icone: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>' },
  { id: 'heros', nom: 'Héros', icone: '<circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 20c.8-3.5 3.3-5.5 6.5-5.5s5.7 2 6.5 5.5"/>' },
  { id: 'quetes', nom: 'Quêtes', icone: '<path d="M5 3h14v18H5z"/><path d="M9 3v4h6V3"/>', bientot: true },
  { id: 'carte', nom: 'Carte', icone: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>', bientot: true },
  { id: 'chronique', nom: 'Chronique', icone: '<path d="M4 4h12a4 4 0 014 4v12H8a4 4 0 01-4-4z"/><path d="M8 9h8M8 13h6"/>' },
];

function navHtml() {
  return `<nav class="nav" aria-label="Navigation principale">${NAV.map((n) => `
    <button type="button" data-tab="${n.id}" ${state.tab === n.id ? 'aria-current="page"' : ''} ${n.bientot ? 'disabled aria-label="' + n.nom + ', bientôt disponible"' : ''}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${n.icone}</svg>${n.nom}
    </button>`).join('')}</nav>`;
}

function enseigneHtml(g) {
  const c = COLORS[g.emblem?.color]?.hex || COLORS.ambre.hex;
  return `
  <header class="enseigne">
    <div class="medaillon" style="--c:${c}">${emblemSvg(g.emblem?.shape, 'Emblème de la guilde')}</div>
    <h1>${esc(g.name)}</h1>
    ${g.motto ? `<p class="devise">« ${esc(g.motto)} »</p>` : ''}
    ${REGIONS[g.region] ? `<p class="devise" style="font-style:normal;font-size:14px;letter-spacing:1.5px;text-transform:uppercase;color:var(--texte-pale)">Repère · ${esc(REGIONS[g.region])}</p>` : ''}
    <div class="pastilles">
      <span class="pastille">Niveau ${g.level}</span>
      <span class="pastille">${g.rosterCount} héros sur ${g.capacity}</span>
      <span class="pastille">Renommée ${g.reputation ?? 0}</span>
    </div>
  </header>`;
}

function vueRepere(g) {
  const recents = state.journal.slice(0, 3);
  return `
  ${enseigneHtml(g)}
  <section class="bloc" aria-labelledby="t-presents">
    <h2 id="t-presents">Au repère en ce moment</h2>
    <p class="vide">Personne pour l’instant. Les tables sont vides, mais la porte est ouverte : les premiers aventuriers ne tarderont pas.</p>
  </section>
  <section class="carnet" aria-labelledby="t-absence">
    <div class="tete"><h2 id="t-absence">Pendant ton absence</h2>
      <a href="#" data-goto="chronique">Toute la chronique</a></div>
    ${recents.length ? recents.map((e) => `<p class="recit">${esc(texteJournal(e))}</p>`).join('') : '<p class="vide">Rien à raconter pour l’instant.</p>'}
  </section>
  <div class="tuiles">
    <div class="tuile avis" aria-disabled="true"><b>Tableau des quêtes</b><span>Bientôt</span></div>
    <div class="tuile" aria-disabled="true"><b>À la porte</b><span>Bientôt</span></div>
    <div class="tuile" aria-disabled="true"><b>Le tournoi</b><span>Bientôt</span></div>
    <button type="button" class="tuile" data-goto="reglages"><b>Mon compte</b><span>Réglages${state.admin ? ' et invités' : ''}</span></button>
  </div>
  <div class="version">${esc(VERSION)}</div>`;
}

function vueHeros(g) {
  return `
  <div class="entete"><h1>Tes héros</h1><p>${g.rosterCount} sur ${g.capacity} places occupées</p></div>
  <section class="bloc"><p class="vide">Aucun héros n’a encore rejoint la guilde. Quand des candidats frapperont à la porte, c’est ici que tu retrouveras ceux que tu auras accueillis.</p></section>`;
}

function vueChronique() {
  return `
  <div class="entete"><h1>Chronique</h1><p>Tout ce qui s’est passé au repère, du plus récent au plus ancien.</p></div>
  ${state.journal.length ? `<ol class="chronique">${state.journal.map((e) => `
    <li><time>${esc(quand(e.at))}</time><span class="recit">${esc(texteJournal(e))}</span></li>`).join('')}</ol>`
    : '<section class="bloc"><p class="vide">La chronique est encore vierge.</p></section>'}`;
}

function vueReglages() {
  return `
  <div class="entete"><h1>Mon compte</h1><p>${esc(state.user?.email || '')}</p></div>
  ${state.admin ? `
  <section class="parchemin" aria-labelledby="t-inv">
    <h1 id="t-inv" style="font-size:22px">Liste des invités</h1>
    <p style="font-size:15px">Seules ces adresses Google peuvent entrer dans le jeu.</p>
    <form class="ligne" id="f-inv">
      <div class="champ" style="flex:1"><label for="inv-mail" class="sr" style="position:absolute;left:-9999px">Adresse e-mail</label>
        <input id="inv-mail" type="email" placeholder="adresse@gmail.com" autocomplete="off" required></div>
      <button class="bouton" type="submit" style="min-height:46px;font-size:16px">Ajouter</button>
    </form>
    <ul class="invites" id="l-inv"><li>Chargement…</li></ul>
  </section>` : ''}
  <div style="padding:16px 20px"><button class="bouton discret" id="btn-out" type="button" style="width:100%">Se déconnecter</button></div>`;
}

function rendre() {
  const g = state.guild;
  if (!g) { ecranChargement(); return; }
  const vues = { repere: vueRepere, heros: vueHeros, chronique: vueChronique, reglages: vueReglages };
  $app.innerHTML = `<main class="ecran">${(vues[state.tab] || vueRepere)(g)}</main>${navHtml()}`;
  window.scrollTo(0, 0);

  $app.querySelectorAll('[data-tab],[data-goto]').forEach((el) => el.addEventListener('click', (ev) => {
    ev.preventDefault();
    state.tab = el.dataset.tab || el.dataset.goto;
    rendre();
  }));
  if (state.tab === 'reglages') brancherReglages();
}

async function brancherReglages() {
  document.getElementById('btn-out').onclick = async () => { stopListeners(); await logout(); };
  if (!state.admin) return;
  const liste = document.getElementById('l-inv');
  const charger = async () => {
    try {
      const { invites } = await api.listInvites();
      liste.innerHTML = invites.map((m) => `<li><span>${esc(m)}</span><button type="button" data-rm="${esc(m)}" aria-label="Retirer ${esc(m)}">Retirer</button></li>`).join('') || '<li>Aucun invité.</li>';
      liste.querySelectorAll('[data-rm]').forEach((b) => b.onclick = async () => {
        if (b.dataset.rm === state.user.email.toLowerCase()) { toast('Tu ne peux pas te retirer toi-même.'); return; }
        await api.manageInvite({ email: b.dataset.rm, action: 'remove' }); charger();
      });
    } catch (e) { liste.innerHTML = `<li>${esc(e.message)}</li>`; }
  };
  document.getElementById('f-inv').onsubmit = async (ev) => {
    ev.preventDefault();
    const input = document.getElementById('inv-mail');
    try { await api.manageInvite({ email: input.value, action: 'add' }); input.value = ''; toast('Invitation ajoutée.'); charger(); }
    catch (e) { toast(e.message); }
  };
  charger();
}

function ouvrirRepere() {
  stopListeners();
  state.tab = 'repere';
  ecranChargement();
  const err = () => toast('La connexion au repère a été interrompue.');
  state.unsub.push(watchGuild(state.guildId, (g) => { state.guild = g; rendre(); }, err));
  state.unsub.push(watchJournal(state.guildId, 50, (j) => { state.journal = j; if (state.guild) rendre(); }, err));
}

/* ---------- Démarrage ---------- */
ecranChargement();
onUser(async (user) => {
  stopListeners();
  state.user = user; state.guild = null; state.journal = [];
  if (!user) { ecranPorte(); return; }
  ecranChargement('On vérifie ton invitation…');
  try {
    const r = await api.enter();
    state.admin = r.admin; state.guildId = r.guildId;
    if (r.guildId) location.replace('jeu.html'); else ecranFondation();
  } catch (e) {
    await logout();
    ecranPorte(e.message);
  }
});
