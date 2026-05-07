const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { uploadImage } = require('../lib/uploadImage');

async function getQuotedOrOwnImageUrl(sock, message) {
    // 1) Quoted image (highest priority)
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (quoted?.imageMessage) {
        const stream = await downloadContentFromMessage(quoted.imageMessage, 'image');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        return await uploadImage(buffer);
    }

    // 2) Image in the current message
    if (message.message?.imageMessage) {
        const stream = await downloadContentFromMessage(message.message.imageMessage, 'image');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        return await uploadImage(buffer);
    }

    return null;
}

async function reminiCommand(sock, chatId, message, args) {
    try {
        let imageUrl = null;
        
        // Check if args contain a URL
        if (args.length > 0) {
            const url = args.join(' ');
            if (isValidUrl(url)) {
                imageUrl = url;
            } else {
                return sock.sendMessage(chatId, { 
                    text: '❌ URL inválida fornecida.\n\nUso: `.remini https://example.com/image.jpg`' 
                }, { quoted: message });
            }
        } else {
            // Try to get image from message or quoted message
            imageUrl = await getQuotedOrOwnImageUrl(sock, message);
            
            if (!imageUrl) {
                return sock.sendMessage(chatId, { 
                    text: '📸 *Comando de Melhoria Remini AI*\n\nUso:\n• `.remini <url_da_imagem>`\n• Responda a uma imagem com `.remini`\n• Envie uma imagem com `.remini`\n\nExemplo: `.remini https://example.com/image.jpg`' 
                }, { quoted: message });
            }
        }

        // Call the Remini API
        const apiUrl = `https://api.princetechn.com/api/tools/remini?apikey=prince_tech_api_azfsbshfb&url=${encodeURIComponent(imageUrl)}`;
        
        const response = await axios.get(apiUrl, {
            timeout: 60000, // 60 second timeout (AI processing takes longer)
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });


        if (response.data && response.data.success && response.data.result) {
            const result = response.data.result;
            
            if (result.image_url) {
                // Download the enhanced image
                const imageResponse = await axios.get(result.image_url, {
                    responseType: 'arraybuffer',
                    timeout: 30000
                });
                
                if (imageResponse.status === 200 && imageResponse.data) {
                    // Send the enhanced image
                    await sock.sendMessage(chatId, {
                        image: imageResponse.data,
                        caption: '✨ *Imagem aprimorada com sucesso!*\n\n𝗘𝗡𝗛𝗔𝗡𝗖𝗘𝗗 𝗕𝗬 𝗞𝗡𝗜𝗚𝗛𝗧-𝗕𝗢𝗧'
                    }, { quoted: message });
                } else {
                    throw new Error('Falha ao baixar a imagem aprimorada');
                }
            } else {
                throw new Error(result.message || 'Falha ao aprimorar a imagem');
            }
        } else {
            throw new Error('API retornou resposta inválida');
        }

    } catch (error) {
        console.error('Erro Remini:', error.message);
        
        let errorMessage = '❌ Falha ao aprimorar a imagem.';
        
        if (error.response?.status === 429) {
            errorMessage = '⏰ Limite de requisições excedido. Por favor, tente novamente mais tarde.';
        } else if (error.response?.status === 400) {
            errorMessage = '❌ URL ou formato de imagem inválido.';
        } else if (error.response?.status === 500) {
            errorMessage = '🔧 Erro no servidor. Por favor, tente novamente mais tarde.';
        } else if (error.code === 'ECONNABORTED') {
            errorMessage = '⏰ Tempo de requisição esgotado. Por favor, tente novamente.';
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
            errorMessage = '🌐 Erro de rede. Por favor, verifique sua conexão.';
        } else if (error.message.includes('Error processing image')) {
            errorMessage = '❌ Falha no processamento da imagem. Por favor, tente com uma imagem diferente.';
        }
        
        await sock.sendMessage(chatId, { 
            text: errorMessage 
        }, { quoted: message });
    }
}

// Helper function to validate URL
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

module.exports = { reminiCommand };