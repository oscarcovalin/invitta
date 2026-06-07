const fs = require('fs');
const path = require('path');

const musicDir = path.join('C:', 'Users', 'Oscar', 'Desktop', 'musicainvitta');
const demosDir = path.join(__dirname, 'demos');

const mapping = {
    'boda-vip': 'Johan y Sofi - Si Te Tengo A Ti Lo Tengo Todo (Deseo Eterno Reprise) - Musica Cristiana - Yeshua.mp3',
    'boda-premium': 'Remix_Boda_ForForever_WeFoundLove.mp3',
    'boda-esencial': '[ Taylor Swift ] - Style  Español.mp3',
    'xv-vip': 'Ariana Grande - bye (lyric visualizer).mp3',
    'xv-premium': 'Taylor Swift - Opalite (Visualizer) [4FUIEcnvT04].mp3',
    'xv-esencial': '[ Taylor Swift ] - Style  Español.mp3' // Se repite por ser 5 pistas
};

for (const [folder, songName] of Object.entries(mapping)) {
    const source = path.join(musicDir, songName);
    const destDir = path.join(demosDir, folder, 'assets');
    const destFile = path.join(destDir, 'music.mp3');

    if (fs.existsSync(source)) {
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        // Copiar sobreescribiendo el music.mp3 anterior
        fs.copyFileSync(source, destFile);
        console.log(`Música copiada a ${folder}: ${songName}`);
    } else {
        console.log(`NO SE ENCONTRÓ la pista: ${songName}`);
    }
}
