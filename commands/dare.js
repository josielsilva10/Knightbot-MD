const fetch = require('node-fetch');

async function dareCommand(sock, chatId, message) {
    try {
        const shizokeys = 'shizo';
        const res = await fetch(`https://shizoapi.onrender.com/api/texts/dare?apikey=${shizokeys}`);
        
        if (!res.ok) {
            throw await res.text();
        }
        
        const json = await res.json();
        const dareMessage = json.result;

        // Enviar a mensagem do desafio
        await sock.sendMessage(chatId, { text: dareMessage }, { quoted: message });
    } catch (error) {
        console.error('Erro no comando dare:', error);
        await sock.sendMessage(chatId, { text: '❌ Falha ao obter desafio. Por favor, tente novamente mais tarde!' }, { quoted: message });
    }
}

module.exports = { dareCommand };