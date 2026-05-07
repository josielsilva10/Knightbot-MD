const fetch = require('node-fetch');

async function truthCommand(sock, chatId, message) {
    try {
        const shizokeys = 'shizo';
        const res = await fetch(`https://shizoapi.onrender.com/api/texts/truth?apikey=${shizokeys}`);
        
        if (!res.ok) {
            throw await res.text();
        }
        
        const json = await res.json();
        const truthMessage = json.result;

        // Enviar a mensagem da verdade
        await sock.sendMessage(chatId, { text: truthMessage }, { quoted: message });
    } catch (error) {
        console.error('Erro no comando truth:', error);
        await sock.sendMessage(chatId, { text: '❌ Falha ao obter a verdade. Por favor, tente novamente mais tarde!' }, { quoted: message });
    }
}

module.exports = { truthCommand };