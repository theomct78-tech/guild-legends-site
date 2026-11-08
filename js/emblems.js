// Emblèmes originaux de guilde (aucun logo officiel). Tracés au trait, couleur via currentColor.
export const SHAPES = {
  etoile:   { nom: 'Étoile',   d: '<path d="M12 2.5l2.6 6.1 6.6.6-5 4.4 1.5 6.5L12 16.7 6.3 20.1l1.5-6.5-5-4.4 6.6-.6z"/>' },
  lanterne: { nom: 'Lanterne', d: '<path d="M9 3h6M12 3v2"/><path d="M8 7h8l1 10H7z"/><path d="M6 17h12M9 21h6M12 10c1.2 1.3 1.2 2.7 0 4-1.2-1.3-1.2-2.7 0-4z"/>' },
  epee:     { nom: 'Épée',     d: '<path d="M12 2l2 3v10h-4V5z"/><path d="M7 15h10M12 15v5"/><circle cx="12" cy="21" r="1"/>' },
  chope:    { nom: 'Chope',    d: '<path d="M5 7h10v13H5z"/><path d="M15 10h2a2 2 0 012 2v3a2 2 0 01-2 2h-2"/><path d="M5 7c0-2 2-3 3.5-2.2C9.5 3.3 12 3 13 4.6 14.5 4 15.5 5.5 15 7"/>' },
  cle:      { nom: 'Clé',      d: '<circle cx="8" cy="8" r="4.5"/><path d="M11.2 11.2L20 20M16.5 16.5l2-2M18.5 18.5l2-2"/>' },
  loup:     { nom: 'Loup',     d: '<path d="M4 4l4 5h8l4-5-1 9-7 8-7-8z"/><path d="M9.5 13h.01M14.5 13h.01M12 16v1.5"/>' },
  flamme:   { nom: 'Flamme',   d: '<path d="M12 2c3 4 6 6.5 6 11a6 6 0 01-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-3 0-5 1-8z"/>' },
  lune:     { nom: 'Lune',     d: '<path d="M19 15.5A8 8 0 018.5 5a8 8 0 1010.5 10.5z"/><path d="M17 4v3M15.5 5.5h3"/>' },
};

export const COLORS = {
  ambre:   { nom: 'Ambre',   hex: '#f0a43a' },
  braise:  { nom: 'Braise',  hex: '#e0703a' },
  mousse:  { nom: 'Mousse',  hex: '#8fbf6a' },
  riviere: { nom: 'Rivière', hex: '#6fb3c8' },
  prune:   { nom: 'Prune',   hex: '#c58fd0' },
  ivoire:  { nom: 'Ivoire',  hex: '#efe2c4' },
};

export function emblemSvg(shape, label = '') {
  const s = SHAPES[shape] || SHAPES.etoile;
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" ${a11y}>${s.d}</svg>`;
}
