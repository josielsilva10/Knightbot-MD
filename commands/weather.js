const axios = require('axios');

module.exports = async function (sock, chatId, message, city) {
    try {
        const apiKey = '4902c0f2550f58298ad4146a92b65e10';  // Replace with your OpenWeather API Key
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
        const weather = response.data;
        const weatherText = `Clima em ${weather.name}: ${weather.weather[0].description}. Temperatura: ${weather.main.temp}°C.`;
        await sock.sendMessage(chatId, { text: weatherText }, { quoted: message }   );
    } catch (error) {
        console.error('Erro ao buscar o clima:', error);
        await sock.sendMessage(chatId, { text: 'Desculpe, não consegui obter o clima no momento.' }, { quoted: message } );
    }
};