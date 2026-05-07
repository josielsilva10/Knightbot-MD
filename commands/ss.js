const fetch = require('node-fetch');

async function handleSsCommand(sock, chatId, message, match) {
    if (!match) {
        await sock.sendMessage(chatId, {
            text: `*FERRAMENTA DE CAPTURA DE TELA*\n\n*.ss <url>*\n*.ssweb <url>*\n*.screenshot <url>*\n\nTire uma captura de tela de qualquer site\n\nExemplo:\n.ss https://google.com\n.ssweb https://google.com\n.screenshot https://google.com`,
            quoted: message
        });
        return;
    }

    try {
        // Show typing indicator
        await sock.presenceSubscribe(chatId);
        await sock.sendPresenceUpdate('composing', chatId);

        // Extract URL from command
        const url = match.trim();
        
        // Validate URL
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return sock.sendMessage(chatId, {
                text: '❌ Por favor, forneça uma URL válida começando com http:// ou https://',
                quoted: message
            });
        }

        // Call the API
        const apiUrl = `https://api.siputzx.my.id/api/tools/ssweb?url=${encodeURIComponent(url)}&theme=light&device=desktop`;
        const response = await fetch(apiUrl, { headers: { 'accept': '*/*' } });
        
        if (!response.ok) {
            throw new Error(`API respondeu com status: ${response.status}`);
        }

        // Get the image buffer
        const imageBuffer = await response.buffer();

        // Send the screenshot
        await sock.sendMessage(chatId, {
            image: imageBuffer,
        }, {
            quoted: message
        });

    } catch (error) {
        console.error('❌ Erro no comando ss:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Falha ao tirar a captura de tela. Por favor, tente novamente em alguns minutos.\n\nPossíveis motivos:\n• URL inválida\n• O site está bloqueando capturas de tela\n• O site está fora do ar\n• O serviço da API está temporariamente indisponível',
            quoted: message
        });
    }
}

module.exports = {
    handleSsCommand
}; 