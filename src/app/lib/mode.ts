// True only in the static GitHub Pages build (see vite.pages.config.ts). There
// is no server there, so content is public and progress lives in the browser.
export const IS_STATIC = import.meta.env.VITE_STATIC === '1'
