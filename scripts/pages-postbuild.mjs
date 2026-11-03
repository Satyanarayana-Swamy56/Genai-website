// GitHub Pages serves 404.html for unknown paths; copying the shell there makes
// client-side routes such as /genai-path/roadmap work on a hard refresh.
import { copyFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const out = fileURLToPath(new URL('../dist-pages', import.meta.url))
copyFileSync(join(out, 'index.html'), join(out, '404.html'))
writeFileSync(join(out, '.nojekyll'), '')
console.log('pages-postbuild: 404.html and .nojekyll written')
