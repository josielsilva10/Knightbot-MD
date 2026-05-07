const axios = require('axios');

module.exports = async function (sock, chatId) {
    try {
        const response = await axios.get('https://icanhazdadjoke.com/', {
            headers: { Accept: 'application/json' }
        });
        const joke = response.data.joke;
        await sock.sendMessage(chatId, { text: joke });
    } catch (error) {
        console.error('Erro ao buscar piada:', error);
        await sock.sendMessage(chatId, { text: 'Desculpe, não consegui buscar uma piada agora.' });
    }
};