const axios = require('axios');
const settings = require('../settings'); // Assuming the API key is stored here

async function gifCommand(sock, chatId, query) {
    const apiKey = settings.giphyApiKey; // Replace with your Giphy API Key

    if (!query) {
        await sock.sendMessage(chatId, { text: 'Por favor, forneça um termo de busca para o GIF.' });
        return;
    }

    try {
        const response = await axios.get(`https://api.giphy.com/v1/gifs/search`, {
            params: {
                api_key: apiKey,
                q: query,
                limit: 1,
                rating: 'g'
            }
        });

        const gifUrl = response.data.data[0]?.images?.downsized_medium?.url;

        if (gifUrl) {
            await sock.sendMessage(chatId, { video: { url: gifUrl }, caption: `Aqui está seu GIF para "${query}"` });
        } else {
            await sock.sendMessage(chatId, { text: 'Nenhum GIF encontrado para o termo de busca.' });
        }
    } catch (error) {
        console.error('Erro ao buscar GIF:', error);
        await sock.sendMessage(chatId, { text: 'Falha ao buscar GIF. Por favor, tente novamente mais tarde.' });
    }
}

module.exports = gifCommand;