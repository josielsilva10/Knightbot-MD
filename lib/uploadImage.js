const fetch = require('node-fetch');
const FormData = require('form-data');
const FileType = require('file-type');
const fs = require('fs');
const path = require('path');

/**
 * Upload de arquivo para qu.ax
 * Tipos mime suportados:
 * - `image/jpeg`
 * - `image/jpg`
 * - `image/png`
 * @param {Buffer} buffer Buffer do arquivo
 * @return {Promise<string>}
 */
async function uploadImage(buffer) {
    try {
        // Cria diretório temporário se não existir
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        // Obtém o tipo do arquivo
        const fileType = await FileType.fromBuffer(buffer);
        const { ext, mime } = fileType || { ext: 'png', mime: 'image/png' };
        const tempFile = path.join(tmpDir, `temp_${Date.now()}.${ext}`);

        // Salva buffer no arquivo temporário
        fs.writeFileSync(tempFile, buffer);

        // Cria form data
        const form = new FormData();
        form.append('files[]', fs.createReadStream(tempFile));

        // Envia para qu.ax
        const response = await fetch('https://qu.ax/upload.php', {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });

        // Remove arquivo temporário
        fs.unlinkSync(tempFile);

        const result = await response.json();
        if (result && result.success) {
            return result.files[0].url;
        } else {
            // Alternativa para telegraph se qu.ax falhar
            const telegraphForm = new FormData();
            telegraphForm.append('file', buffer, {
                filename: `upload.${ext}`,
                contentType: mime
            });

            const telegraphResponse = await fetch('https://telegra.ph/upload', {
                method: 'POST',
                body: telegraphForm
            });

            const img = await telegraphResponse.json();
            if (img[0]?.src) {
                return 'https://telegra.ph' + img[0].src;
            }
            
            throw new Error('Falha ao enviar imagem para ambos os serviços');
        }
    } catch (error) {
        console.error('Erro no upload:', error);
        throw error;
    }
}

module.exports = { uploadImage };

/**
 * Upload alternativo para telegra.ph (backup)
 */
/*
async function uploadImageTelegraph(buffer) {
    try {
        const { ext, mime } = await fileTypeFromBuffer(buffer);
        const form = new FormData();
        const blob = new Blob([buffer.toArrayBuffer()], { type: mime });
        form.append('file', blob, 'tmp.' + ext);

        const response = await fetch('https://telegra.ph/upload', {
            method: 'POST',
            body: form
        });

        const img = await response.json();
        if (img.error) throw img.error;
        return 'https://telegra.ph' + img[0].src;
    } catch (error) {
        throw error;
    }
}
*/ 