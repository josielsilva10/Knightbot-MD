const { ttdl } = require("ruhend-scraper");
const axios = require('axios');

// Store processed message IDs to prevent duplicates
const processedMessages = new Set();

async function tiktokCommand(sock, chatId, message) {
    try {
        // Check if message has already been processed
        if (processedMessages.has(message.key.id)) {
            return;
        }
        
        // Add message ID to processed set
        processedMessages.add(message.key.id);
        
        // Clean up old message IDs after 5 minutes
        setTimeout(() => {
            processedMessages.delete(message.key.id);
        }, 5 * 60 * 1000);

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        
        if (!text) {
            return await sock.sendMessage(chatId, { 
                text: "Por favor, forneça um link do TikTok para o vídeo."
            });
        }

        // Extract URL from command
        const url = text.split(' ').slice(1).join(' ').trim();
        
        if (!url) {
            return await sock.sendMessage(chatId, { 
                text: "Por favor, forneça um link do TikTok para o vídeo."
            });
        }

        // Check for various TikTok URL formats
        const tiktokPatterns = [
            /https?:\/\/(?:www\.)?tiktok\.com\//,
            /https?:\/\/(?:vm\.)?tiktok\.com\//,
            /https?:\/\/(?:vt\.)?tiktok\.com\//,
            /https?:\/\/(?:www\.)?tiktok\.com\/@/,
            /https?:\/\/(?:www\.)?tiktok\.com\/t\//
        ];

        const isValidUrl = tiktokPatterns.some(pattern => pattern.test(url));
        
        if (!isValidUrl) {
            return await sock.sendMessage(chatId, { 
                text: "Esse não é um link válido do TikTok. Por favor, forneça um link válido de vídeo do TikTok."
            });
        }

        await sock.sendMessage(chatId, {
            react: { text: '🔄', key: message.key }
        });

        try {
            // Use only Siputzx API
            const apiUrl = `https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(url)}`;



            let videoUrl = null;
            let audioUrl = null;
            let title = null;

            // Call Siputzx API
            try {
                const response = await axios.get(apiUrl, { 
                    timeout: 15000,
                    headers: {
                        'accept': '*/*',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                if (response.data && response.data.status) {
                    // Check if the API returned video data
                    if (response.data.data) {
                        // Check for urls array first (this is the main response format)
                        if (response.data.data.urls && Array.isArray(response.data.data.urls) && response.data.data.urls.length > 0) {
                            // Use the first URL from the urls array (usually HD quality)
                            videoUrl = response.data.data.urls[0];
                            title = response.data.data.metadata?.title || "Vídeo do TikTok";
                        } else if (response.data.data.video_url) {
                            videoUrl = response.data.data.video_url;
                            title = response.data.data.metadata?.title || "Vídeo do TikTok";
                        } else if (response.data.data.url) {
                            videoUrl = response.data.data.url;
                            title = response.data.data.metadata?.title || "Vídeo do TikTok";
                        } else if (response.data.data.download_url) {
                            videoUrl = response.data.data.download_url;
                            title = response.data.data.metadata?.title || "Vídeo do TikTok";
                        } else {
                            throw new Error("Nenhum URL de vídeo encontrado na resposta da API Siputzx");
                        }
                    } else {
                        throw new Error("Nenhum campo de dados na resposta da API Siputzx");
                    }
                } else {
                    throw new Error("Resposta inválida da API Siputzx");
                }
            } catch (apiError) {
                console.error(`Falha na API Siputzx: ${apiError.message}`);
            }

            // If Siputzx API didn't work, try the original ttdl method
            if (!videoUrl) {
                try {
                    let downloadData = await ttdl(url);
                    if (downloadData && downloadData.data && downloadData.data.length > 0) {
                        const mediaData = downloadData.data;
                        for (let i = 0; i < Math.min(20, mediaData.length); i++) {
                            const media = mediaData[i];
                            const mediaUrl = media.url;

                            // Check if URL ends with common video extensions
                            const isVideo = /\.(mp4|mov|avi|mkv|webm)$/i.test(mediaUrl) || 
                                          media.type === 'video';

                            if (isVideo) {
                                await sock.sendMessage(chatId, {
                                    video: { url: mediaUrl },
                                    mimetype: "video/mp4",
                                    caption: "𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 𝗞𝗡𝗜𝗚𝗛𝗧-𝗕𝗢𝗧"
                                }, { quoted: message });
                            } else {
                                await sock.sendMessage(chatId, {
                                    image: { url: mediaUrl },
                                    caption: "𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 𝗞𝗡𝗜𝗚𝗛𝗧-𝗕𝗢𝗧"
                                }, { quoted: message });
                            }
                        }
                        return;
                    }
                } catch (ttdlError) {
                    console.error("A alternativa ttdl também falhou:", ttdlError.message);
                }
            }

            // Send the video if we got a URL from the APIs
            if (videoUrl) {
                try {
                    // Download video as buffer
                    const videoResponse = await axios.get(videoUrl, {
                        responseType: 'arraybuffer',
                        timeout: 60000,
                        maxContentLength: 100 * 1024 * 1024, // 100MB limit
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept': 'video/mp4,video/*,*/*;q=0.9',
                            'Accept-Language': 'en-US,en;q=0.9',
                            'Accept-Encoding': 'gzip, deflate, br',
                            'Connection': 'keep-alive',
                            'Referer': 'https://www.tiktok.com/'
                        }
                    });
                    
                    const videoBuffer = Buffer.from(videoResponse.data);
                    
                    // Validate video buffer
                    if (videoBuffer.length === 0) {
                        throw new Error("O buffer do vídeo está vazio");
                    }
                    
                    // Check if it's a valid video file (starts with video file signatures)
                    const isValidVideo = videoBuffer.length > 1000 && (
                        videoBuffer.toString('hex', 0, 4) === '000001ba' || // MP4
                        videoBuffer.toString('hex', 0, 4) === '000001b3' || // MP4
                        videoBuffer.toString('hex', 0, 8) === '0000001866747970' || // MP4
                        videoBuffer.toString('hex', 0, 4) === '1a45dfa3' // WebM
                    );
                    
                    if (!isValidVideo && videoBuffer.length < 10000) {
                        const bufferText = videoBuffer.toString('utf8', 0, 200);
                        if (bufferText.includes('error') || bufferText.includes('blocked') || bufferText.includes('403')) {
                            throw new Error("Recebida página de erro em vez do vídeo");
                        }
                    }
                    
                    const caption = title ? `𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 𝗞𝗡𝗜𝗚𝗛𝗧-𝗕𝗢𝗧\n\n📝 Título: ${title}` : "𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 𝗞𝗡𝗜𝗚𝗛𝗧-𝗕𝗢𝗧";
                    
                    await sock.sendMessage(chatId, {
                        video: videoBuffer,
                        mimetype: "video/mp4",
                        caption: caption
                    }, { quoted: message });

                    // If we have audio URL, download and send it as well
                    if (audioUrl) {
                        try {
                            const audioResponse = await axios.get(audioUrl, {
                                responseType: 'arraybuffer',
                                timeout: 30000,
                                headers: {
                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                                }
                            });
                            
                            const audioBuffer = Buffer.from(audioResponse.data);
                            
                            await sock.sendMessage(chatId, {
                                audio: audioBuffer,
                                mimetype: "audio/mp3",
                                caption: "🎵 Áudio do TikTok"
                            }, { quoted: message });
                        } catch (audioError) {
                            console.error(`Falha ao baixar o áudio: ${audioError.message}`);
                        }
                    }
                    return;
                } catch (downloadError) {
                    console.error(`Falha ao baixar o vídeo: ${downloadError.message}`);
                    // Fallback to URL method
                    try {
                        const caption = title ? `𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 𝗞𝗡𝗜𝗚𝗛𝗧-𝗕𝗢𝗧\n\n📝 Título: ${title}` : "𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 𝗞𝗡𝗜𝗚𝗛𝗧-𝗕𝗢𝗧";
                        
                        await sock.sendMessage(chatId, {
                            video: { url: videoUrl },
                            mimetype: "video/mp4",
                            caption: caption
                        }, { quoted: message });
                        return;
                    } catch (urlError) {
                        console.error(`O método de URL também falhou: ${urlError.message}`);
                    }
                }
            }

            // If we reach here, no method worked
            return await sock.sendMessage(chatId, { 
                text: "❌ Falha ao baixar o vídeo do TikTok. Todos os métodos de download falharam. Por favor, tente novamente com um link diferente ou verifique se o vídeo está disponível."
            },{ quoted: message });
        } catch (error) {
            console.error('Erro no download do TikTok:', error);
            await sock.sendMessage(chatId, { 
                text: "Falha ao baixar o vídeo do TikTok. Por favor, tente novamente com um link diferente."
            },{ quoted: message });
        }
    } catch (error) {
        console.error('Erro no comando TikTok:', error);
        await sock.sendMessage(chatId, { 
            text: "Ocorreu um erro ao processar a solicitação. Por favor, tente novamente mais tarde."
        },{ quoted: message });
    }
}

module.exports = tiktokCommand; 