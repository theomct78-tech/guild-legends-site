// Régions officielles de Runeterra. Les identifiants doivent correspondre à REGIONS côté serveur.
export const REGIONS = {
  bandle: 'Bandle',
  bilgewater: 'Bilgewater',
  demacia: 'Demacia',
  freljord: 'Freljord',
  ionia: 'Ionia',
  ixtal: 'Ixtal',
  noxus: 'Noxus',
  piltover: 'Piltover',
  shurima: 'Shurima',
  targon: 'Targon',
  zaun: 'Zaun',
};

// Régions qu'on peut choisir à la fondation : celles dont les missions des deux premiers paliers sont écrites.
// Doit rester égale à regionsOuvertes() côté serveur (functions/src/monde.js) ; un test le vérifie.
export const REGIONS_OUVERTES = ['demacia', 'freljord', 'ionia', 'noxus', 'piltover'];
