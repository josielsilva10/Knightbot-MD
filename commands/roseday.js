const fetch = require('node-fetch');

async function rosedayCommand(sock, chatId, message) {
    try {
        
        const res = await fetch(`https://api.princetechn.com/api/fun/roseday?apikey=prince`);
        
        if (!res.ok) {
            throw await res.text();
        }
        
        const json = await res.json();
        const rosedayMessage = json.result;

        // Enviar a mensagem do dia da rosa
        await sock.sendMessage(chatId, { text: rosedayMessage }, { quoted: message });
    } catch (error) {
        console.error('Erro no comando roseday:', error);
        await sock.sendMessage(chatId, { text: '❌ Falha ao obter a citação do dia da rosa. Por favor, tente novamente mais tarde!' }, { quoted: message });
    }
}

module.exports = { rosedayCommand };