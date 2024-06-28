const express = require('express');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Ruta para la URL raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/test', (req, res) => {
    res.send('Test route working');
});

app.get('/download', async (req, res) => {
    const videoUrl = req.query.url;
    const audioFormat = req.query.format || 'mp3'; // Formato de audio por defecto

    if (!videoUrl || !ytdl.validateURL(videoUrl)) {
        return res.status(400).send('URL INVALIDO');
    }

    try {
        const videoInfo = await ytdl.getInfo(videoUrl);
        const videoTitle = videoInfo.videoDetails.title.replace(/[^\x00-\x7F]/g, ""); // Remove non-ASCII characters
        const audioOutput = `${videoTitle}.${audioFormat}`; // Nombre de archivo basado en el título del video y el formato de audio

        const audioOptions = {
            quality: 'highestaudio',
            filter: 'audioonly',
            format: audioFormat
        };

        // Descargar el video y convertirlo a audio con el formato seleccionado
        ytdl(videoUrl, audioOptions)
            .pipe(fs.createWriteStream(audioOutput))
            .on('finish', () => {
                console.log('Descarga y conversión completadas.');
                res.download(audioOutput, audioOutput, (err) => { // Usar audioOutput como nombre del archivo descargado
                    if (err) {
                        console.error('Error al enviar el archivo:', err);
                        res.status(500).send('Error al enviar el archivo');
                    }
                    // Eliminar el archivo de audio después de la descarga
                    fs.unlinkSync(audioOutput);
                });
            });
    } catch (error) {
        console.error('Error durante el procesamiento:', error);
        res.status(500).send('Error durante el procesamiento');
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
