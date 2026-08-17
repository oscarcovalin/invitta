const fs = require('fs');
const path = require('path');

function decodeMojibake(text) {
  let prev = '';
  let curr = text;
  let iterations = 0;
  
  // DecodificaciÃ³n iterativa. Si falla, ignorar y seguir.
  while (prev !== curr && iterations < 5) {
    prev = curr;
    try {
      // Intentar decodificar como si fuera iso-8859-1 o win-1252 leÃ­do como utf-8
      const buffer = Buffer.from(curr, 'binary');
      const decoded = buffer.toString('utf8');
      
      // Si la decodificaciÃ³n resulta en caracteres vÃ¡lidos en lugar de 
      if (!decoded.includes('') && decoded !== curr) {
        // Chequeo de seguridad: a veces 'binary' descarta caracteres que estaban bien
        // Vamos a verificar si esto resolviÃ³ algÃºn patrÃ³n conocido como Ãƒ
        if (curr.includes('Ã')) {
          curr = decoded;
        }
      }
    } catch (e) {
      break;
    }
    iterations++;
  }
  
  // Fallback a reemplazos manuales para patrones muy rotos
  return curr
    .replace(/ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â /g, ' - ')
    .replace(/ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡/g, 'á')
    .replace(/ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©/g, 'é')
    .replace(/ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­/g, 'í')
    .replace(/ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³/g, 'ó')
    .replace(/ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âº/g, 'ú')
    .replace(/ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±/g, 'ñ')
    .replace(/ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â/g, ' ') // Espacios o caracteres residuales
    .replace(/ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢/g, "'")
    .replace(/ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡/g, '')
    .replace(/ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â/g, '')
    .replace(/ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢/g, '')
    .replace(/ÃƒÆ’Ã¢â‚¬Â /g, '')
    .replace(/ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢/g, '')
    // Fallback secundario si los grandes no pegan
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã±/g, 'ñ')
    .replace(/Ã /g, 'Á')
    .replace(/Ã‰/g, 'É')
    .replace(/Ã /g, 'Í')
    .replace(/Ã“/g, 'Ó')
    .replace(/Ãš/g, 'Ú')
    .replace(/Ã‘/g, 'Ñ')
    .replace(/Ã¼/g, 'ü')
    .replace(/Ã¿/g, '')
    .replace(/Ã‚/g, '')
    .replace(/Â/g, '')
    .replace(/Ãƒ/g, 'í') // Approximation for residual Ãƒ
    .replace(/Ã¢â‚¬â„¢/g, "'")
    .replace(/Ã¢â‚¬Å“/g, '"')
    .replace(/Ã¢â‚¬Â/g, '"')
    .replace(/Ã¢â‚¬â€œ/g, '-')
    .replace(/Ã‚Â/g, ' ')
    .replace(/Ã‚Â¡/g, '¡')
    .replace(/Ã‚Â¿/g, '¿');
}

const targetFile = path.join(__dirname, 'js', 'invitation-public.js');

try {
  let content = fs.readFileSync(targetFile, 'utf8');
  let newContent = decodeMojibake(content);
  // Limpiar algunos patrones rotos extra
  newContent = newContent.replace(/íÆí†í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢/g, '');
  newContent = newContent.replace(/í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢í¢/g, '');
  
  fs.writeFileSync(targetFile, newContent, 'utf8');
  console.log(`Corregido: ${targetFile}`);
} catch (e) {
  console.error("Error corrigiendo archivo", e);
}
