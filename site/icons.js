/* Shared SVG icon library. Each value is the INNER markup of a
   <svg viewBox="0 0 24 24"> element. Stroke icons use currentColor. */
window.ICONS = {
  chart:   '<path d="M3 17l6-6 4 4 8-8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 21h18" fill="none" stroke="currentColor" stroke-width="2"/>',
  layers:  '<path d="M12 2L2 7l10 5 10-5-10-5z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5" fill="none" stroke="currentColor" stroke-width="2"/>',
  wrench:  '<path d="M14.7 6.3a4 4 0 00-5.6 5.6l-6 6a2 2 0 102.8 2.8l6-6a4 4 0 005.6-5.6l-2.5 2.5-2.2-2.2 2.5-2.5z" fill="none" stroke="currentColor" stroke-width="2"/>',
  grid:    '<rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 9h18M9 21V9" fill="none" stroke="currentColor" stroke-width="2"/>',
  home:    '<path d="M2 20h20M5 20V8l7-5 7 5v12M9 20v-6h6v6" fill="none" stroke="currentColor" stroke-width="2"/>',
  road:    '<path d="M12 2v20M5 5v14M19 5v14" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 3"/>',
  star:    '<path d="M12 2l2.4 7.4H22l-6 4.5 2.3 7.1-6.3-4.6L5.7 21l2.3-7.1-6-4.5h7.6z" fill="none" stroke="currentColor" stroke-width="2"/>',
  users:   '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="7" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" fill="none" stroke="currentColor" stroke-width="2"/>',
  shield:  '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 12l2 2 4-4" fill="none" stroke="currentColor" stroke-width="2"/>',
  clock:   '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 6v6l4 2" fill="none" stroke="currentColor" stroke-width="2"/>',
  check:   '<path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  checkbox:'<path d="M9 11l3 3L22 4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" fill="none" stroke="currentColor" stroke-width="2"/>',
  location:'<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="10" r="3" fill="none" stroke="currentColor" stroke-width="2"/>',
  phone:   '<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z" fill="none" stroke="currentColor" stroke-width="2"/>',
  arrow:   '<path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4"/>',
  building:'<path d="M2 20h20M4 20V9l5 3V9l5 3V4l6 3v13" fill="none" stroke="currentColor" stroke-width="2"/>',
  truck:   '<path d="M4 19h16M4 19l4-9h8l4 9M9 10V6h6v4" fill="none" stroke="currentColor" stroke-width="2"/>'
};
window.ICON_KEYS = Object.keys(window.ICONS);
/* WhatsApp glyph (filled) — used in buttons */
window.WA_GLYPH = '<path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.207zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>';
