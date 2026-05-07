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

module.exports = {
    name: 'removebg',
    alias: ['rmbg', 'nobg'],
    category: 'general',
    desc: 'Remove background from images',
    async exec(sock, message, args) {
        try {
            const chatId = message.key.remoteJid;
            let imageUrl = null;
            
            // Check if args contain a URL
            if (args.length > 0) {
                const url = args.join(' ');
                if (isValidUrl(url)) {
                    imageUrl = url;
                } else {
                    return sock.sendMessage(chatId, { 
                        text: '❌ URL inválida fornecida.\n\nUso: `.removebg https://example.com/image.jpg`' 
                    }, { quoted: message });
                }
            } else {
                // Try to get image from message or quoted message
                imageUrl = await getQuotedOrOwnImageUrl(sock, message);
                
                if (!imageUrl) {
                    return sock.sendMessage(chatId, { 
                        text: '📸 *Comando Remover Fundo*\n\nUso:\n• `.removebg <url_da_imagem>`\n• Responda a uma imagem com `.removebg`\n• Envie uma imagem com `.removebg`\n\nExemplo: `.removebg https://example.com/image.jpg`' 
                    }, { quoted: message });
                }
            }

        
            // Call the remove background API
            const apiUrl = `https://api.siputzx.my.id/api/iloveimg/removebg?image=${encodeURIComponent(imageUrl)}`;
            
            const response = await axios.get(apiUrl, {
                responseType: 'arraybuffer',
                timeout: 30000, // 30 second timeout
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (response.status === 200 && response.data) {
                // Send the processed image
                await sock.sendMessage(chatId, {
                    image: response.data,
                    caption: '✨ *Fundo removido com sucesso!*\n\n𝗣𝗥𝗢𝗖𝗘𝗦𝗦𝗔𝗗𝗢 𝗣𝗘𝗟𝗢 𝗞𝗡𝗜𝗚𝗛𝗧-𝗕𝗢𝗧'
                }, { quoted: message });
            } else {
                throw new Error('Failed to process image');
            }

        } catch (error) {
            console.error('RemoveBG Error:', error.message);
            
            let errorMessage = '❌ Falha ao remover o fundo.';
            
            if (error.response?.status === 429) {
                errorMessage = '⏰ Limite de requisições excedido. Por favor, tente novamente mais tarde.';
            } else if (error.response?.status === 400) {
                errorMessage = '❌ URL ou formato da imagem inválido.';
            } else if (error.response?.status === 500) {
                errorMessage = '🔧 Erro no servidor. Por favor, tente novamente mais tarde.';
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = '⏰ Tempo de requisição esgotado. Por favor, tente novamente.';
            } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
                errorMessage = '🌐 Erro de rede. Por favor, verifique sua conexão.';
            }
            
            await sock.sendMessage(chatId, { 
                text: errorMessage 
            }, { quoted: message });
        }
    }
};

// Helper function to validate URL
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}