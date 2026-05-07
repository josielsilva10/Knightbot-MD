const fetch = require('node-fetch');

async function memeCommand(sock, chatId, message) {
    try {
        const response = await fetch('https://shizoapi.onrender.com/api/memes/cheems?apikey=shizo');
        
        // Check if response is an image
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('image')) {
            const imageBuffer = await response.buffer();
            
            const buttons = [
                { buttonId: '.meme', buttonText: { displayText: '🎭 Outro Meme' }, type: 1 },
                { buttonId: '.joke', buttonText: { displayText: '😄 Piada' }, type: 1 }
            ];

            await sock.sendMessage(chatId, { 
                image: imageBuffer,
                caption: "> Aqui está seu meme do cheems! 🐕",
                buttons: buttons,
                headerType: 1
            },{ quoted: message});
        } else {
            throw new Error('Invalid response type from API');
        }
    } catch (error) {
        console.error('Erro no comando meme:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Falha ao buscar meme. Por favor, tente novamente mais tarde.'
        },{ quoted: message });
    }
}

module.exports = memeCommand;