const fetch = require('node-fetch');

async function flirtCommand(sock, chatId, message) {
    try {
        const shizokeys = 'shizo';
        const res = await fetch(`https://shizoapi.onrender.com/api/texts/flirt?apikey=${shizokeys}`);
        
        if (!res.ok) {
            throw await res.text();
        }
        
        const json = await res.json();
        const flirtMessage = json.result;

        // Enviar a mensagem de paquera
        await sock.sendMessage(chatId, { text: flirtMessage }, { quoted: message });
    } catch (error) {
        console.error('Erro no comando flirt:', error);
        await sock.sendMessage(chatId, { text: '❌ Falha ao obter mensagem de paquera. Por favor, tente novamente mais tarde!' }, { quoted: message });
    }
}

module.exports = { flirtCommand }; 