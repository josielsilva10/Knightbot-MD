const axios = require('axios');

module.exports = async function (sock, chatId, message) {
    try {
        const response = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
        const fact = response.data.text;
        await sock.sendMessage(chatId, { text: fact },{ quoted: message });
    } catch (error) {
        console.error('Erro ao buscar fato:', error);
        await sock.sendMessage(chatId, { text: 'Desculpe, não consegui buscar um fato no momento.' },{ quoted: message });
    }
};