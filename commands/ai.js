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

            if (command === '.gpt' || command === '.ia' || command === '.ai' || command === 'ia' || command === 'gpt' || command === 'ai') {
                // Prioridade: Groq (Mais estável e rápida)
                if (settings.groqApiKey && settings.groqApiKey !== 'SUA_CHAVE_AQUI') {
                    console.log('🤖 Tentando resposta via Groq...');
                    try {
                        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${settings.groqApiKey}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                model: 'llama3-8b-8192',
                                messages: [
                                    { role: 'system', content: 'Você é o Cavaleiro Bot, um assistente prestativo e amigável. Responda sempre em Português do Brasil.' },
                                    { role: 'user', content: query }
                                ]
                            })
                        });
                        const data = await response.json();
                        if (data.choices && data.choices[0].message.content) {
                            return await sock.sendMessage(chatId, { text: data.choices[0].message.content }, { quoted: message });
                        }
                    } catch (e) {
                        console.error('❌ Erro na Groq:', e.message);
                    }
                }

                // Backup: APIs Gratuitas
                console.log('🤖 Tentando APIs de backup...');
                const apis = [
                    { url: `https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(query)}&name=KnightBot&owner=Josiel`, path: 'response' },
                    { url: `https://api.simsimi.vn/v1/simtalk`, method: 'POST', body: `text=${encodeURIComponent(query)}&lc=pt`, path: 'message' }
                ];

                for (const api of apis) {
                    try {
                        let response;
                        if (api.method === 'POST') {
                            response = await fetch(api.url, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                body: api.body
                            });
                        } else {
                            response = await fetch(api.url);
                        }
                        const data = await response.json();
                        const answer = data[api.path] || data.result || data.answer || data.message || data.data;
                        if (answer) {
                            return await sock.sendMessage(chatId, { text: answer }, { quoted: message });
                        }
                    } catch (e) { 
                        console.error(`❌ Falha na API ${api.url}:`, e.message);
                        continue; 
                    }
                }

                // Backup final: API SimSimi direta
                try {
                    const res = await fetch(`https://api.simsimi.vn/v1/simtalk`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: `text=${encodeURIComponent(query)}&lc=pt`
                    });
                    const json = await res.json();
                    if (json.message) {
                        return await sock.sendMessage(chatId, { text: json.message }, { quoted: message });
                    }
                } catch (e) { console.error('Erro no backup final:', e.message); }

                throw new Error('Todas as APIs de IA falharam');
            } else if (command === '.gemini') {
                // Usando Gemini 1.5 Flash (mais rápido e estável)
                if (settings.geminiApiKey && settings.geminiApiKey !== 'SUA_CHAVE_GEMINI_AQUI') {
                    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${settings.geminiApiKey}`, {
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
                    } else if (data.error) {
                        throw new Error(`Google AI Error: ${data.error.message}`);
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
