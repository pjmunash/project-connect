// Quick syntax checker for .js files
// It strips import/export statements and attempts to create a Function from the code to detect syntax errors.
// Usage: node tools/checkJsSyntax.js

const fs = require('fs')
const path = require('path')

const roots = [path.resolve(__dirname, '..', 'frontend', 'src'), path.resolve(__dirname, '..', 'backend', 'src')]
const exts = ['.js']
let errors = []

function walk(dir){
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries){
    const full = path.join(dir, e.name)
    if (e.isDirectory()){
      walk(full)
    } else if (e.isFile() && exts.includes(path.extname(full))){
      try{
        const raw = fs.readFileSync(full, 'utf8')
        // remove import lines, and strip only the 'export' keyword so function declarations remain
        const lines = raw.split(/\r?\n/)
        for (let i = 0; i < lines.length; i++){
          if (/^\s*import\b/.test(lines[i])) {
            lines[i] = ''
          } else if (/^\s*export\s+default\b/.test(lines[i])){
            lines[i] = lines[i].replace(/^\s*export\s+default\b/, 'const __default =')
          } else {
            lines[i] = lines[i].replace(/^\s*export\s+/, '')
          }
        }
        let cleaned = lines.join('\n')
        // replace import.meta with a harmless placeholder so parsing doesn't fail outside ESM
        cleaned = cleaned.replace(/import\.meta/g, '({})')
        try{
          // Attempt to parse by creating a Function
          new Function(cleaned)
        }catch(err){
          errors.push({ file: full, error: err && err.message ? err.message : String(err) })
        }
      }catch(err){
        errors.push({ file: full, error: 'read error: ' + (err.message||err) })
      }
    }
  }
}

for (const r of roots){
  if (fs.existsSync(r)) walk(r)
}

if (errors.length){
  console.error('Syntax errors found:')
  for (const e of errors) console.error(e.file + ': ' + e.error)
  process.exit(2)
}
console.log('No syntax errors detected for .js files (imports/exports stripped).')
