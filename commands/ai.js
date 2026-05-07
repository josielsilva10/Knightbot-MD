const axios = require('axios');
const fetch = require('node-fetch');
const settings = require('../settings');

async function aiCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        
        if (!text) {
            return await sock.sendMessage(chatId, { 
                text: "Por favor, forneça uma pergunta após .gpt ou .gemini\n\nExemplo: .gpt escreva um código html básico"
            }, {
                quoted: message
            });
        }

        const parts = text.split(' ');
        const command = parts[0].toLowerCase();
        const query = parts.slice(1).join(' ').trim();

        if (!query) {
            return await sock.sendMessage(chatId, { 
                text: "Por favor, forneça uma pergunta após .gpt ou .gemini"
            }, {quoted:message});
        }

        try {
            await sock.sendMessage(chatId, {
                react: { text: '🤖', key: message.key }
            });

            if (command === '.gpt') {
                // Nova API do ChatGPT mais estável
                const apis = [
                    { url: `https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(query)}&name=KnightBot&owner=Josiel`, path: 'response' },
                    { url: `https://api.simsimi.vn/v1/simtalk`, method: 'POST', body: `text=${encodeURIComponent(query)}&lc=pt`, path: 'message' }
                ];

                for (const api of apis) {
                    try {
                        let response;
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos de timeout

                        if (api.method === 'POST') {
                            response = await fetch(api.url, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                body: api.body,
                                signal: controller.signal
                            });
                        } else {
                            response = await fetch(api.url, { signal: controller.signal });
                        }
                        clearTimeout(timeoutId);
                        const data = await response.json();
                        const answer = data[api.path] || data.result || data.answer || data.message || data.data;
                        if (answer) {
                            await sock.sendMessage(chatId, { text: answer }, { quoted: message });
                            return;
                        }
                    } catch (e) { continue; }
                }
                throw new Error('Todas as APIs do GPT falharam');
            } else if (command === '.gemini') {
                // Se o usuário configurou uma chave própria, usa a API oficial
                if (settings.geminiApiKey && settings.geminiApiKey !== 'SUA_CHAVE_GEMINI_AQUI') {
                    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${settings.geminiApiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: query }] }]
                        })
                    });
                    
                    const data = await response.json();
                    if (data.candidates && data.candidates[0].content.parts[0].text) {
                        const answer = data.candidates[0].content.parts[0].text;
                        await sock.sendMessage(chatId, { text: answer }, { quoted: message });
                        return;
                    }
                }

                // Caso não tenha chave ou a oficial falhe, tenta as gratuitas como backup
                const apis = [
                    `https://vapis.my.id/api/gemini?q=${encodeURIComponent(query)}`,
                    `https://api.siputzx.my.id/api/ai/gemini-pro?content=${encodeURIComponent(query)}`,
                    `https://zellapi.autos/ai/chatbot?text=${encodeURIComponent(query)}`
                ];

                for (const api of apis) {
                    try {
                        const response = await fetch(api);
                        const data = await response.json();
                        if (data.message || data.data || data.answer || data.result) {
                            const answer = data.message || data.data || data.answer || data.result;
                            await sock.sendMessage(chatId, { text: answer }, { quoted: message });
                            return;
                        }
                    } catch (e) { continue; }
                }
                throw new Error('Todas as APIs do Gemini falharam');
            }
        } catch (error) {
            console.error('Erro na IA:', error);
            let errorMessage = "❌ Falha ao obter resposta da IA.";
            
            if (error.message.includes('403')) {
                errorMessage = "❌ Erro 403: Sua chave do Gemini pode estar incorreta ou sem permissão.";
            } else if (error.message.includes('429')) {
                errorMessage = "❌ Erro 429: Limite de uso da API atingido. Tente novamente em alguns minutos.";
            } else if (error.message.includes('400')) {
                errorMessage = "❌ Erro 400: Requisição inválida. Verifique o formato da pergunta.";
            }
            
            await sock.sendMessage(chatId, {
                text: `${errorMessage}\n\nDetalhe: ${error.message}`,
                quoted: message
            });
        }
    } catch (error) {
        console.error('Erro no comando de IA:', error);
    }
}

module.exports = aiCommand;
