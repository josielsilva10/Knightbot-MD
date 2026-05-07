const fetch = require('node-fetch');

async function goodnightCommand(sock, chatId, message) {
    try {
        const shizokeys = 'shizo';
        const res = await fetch(`https://shizoapi.onrender.com/api/texts/lovenight?apikey=${shizokeys}`);
        
        if (!res.ok) {
            throw await res.text();
        }
        
        const json = await res.json();
        const goodnightMessage = json.result;

        // Enviar a mensagem de boa noite
        await sock.sendMessage(chatId, { text: goodnightMessage }, { quoted: message });
    } catch (error) {
        console.error('Erro no comando goodnight:', error);
        await sock.sendMessage(chatId, { text: '❌ Falha ao obter a mensagem de boa noite. Por favor, tente novamente mais tarde!' }, { quoted: message });
    }
}

module.exports = { goodnightCommand }; 