/**
 * Knight Bot - A WhatsApp Bot
 * Comando Autoleitura - Ler automaticamente todas as mensagens
 */

const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');

// Caminho para armazenar a configuração
const configPath = path.join(__dirname, '..', 'data', 'autoread.json');

// Inicializa o arquivo de configuração se não existir
function initConfig() {
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify({ enabled: false }, null, 2));
    }
    return JSON.parse(fs.readFileSync(configPath));
}

// Alterna o recurso de autoleitura
async function autoreadCommand(sock, chatId, message) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
        
        if (!message.key.fromMe && !isOwner) {
            await sock.sendMessage(chatId, {
                text: '❌ Este comando está disponível apenas para o dono!',
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363161513685998@newsletter',
                        newsletterName: 'KnightBot MD',
                        serverMessageId: -1
                    }
                }
            });
            return;
        }

        // Obtém os argumentos do comando
        const args = message.message?.conversation?.trim().split(' ').slice(1) || 
                    message.message?.extendedTextMessage?.text?.trim().split(' ').slice(1) || 
                    [];
        
        // Inicializa ou lê a configuração
        const config = initConfig();
        
        // Alterna com base no argumento ou alterna o estado atual se não houver argumento
        if (args.length > 0) {
            const action = args[0].toLowerCase();
            if (action === 'on' || action === 'enable') {
                config.enabled = true;
            } else if (action === 'off' || action === 'disable') {
                config.enabled = false;
            } else {
                await sock.sendMessage(chatId, {
                    text: '❌ Opção inválida! Use: .autoread on/off',
                    contextInfo: {
                        forwardingScore: 1,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363161513685998@newsletter',
                            newsletterName: 'KnightBot MD',
                            serverMessageId: -1
                        }
                    }
                });
                return;
            }
        } else {
            // Alterna o estado atual
            config.enabled = !config.enabled;
        }
        
        // Salva a configuração atualizada
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        
        // Envia mensagem de confirmação
        await sock.sendMessage(chatId, {
            text: `✅ Autoleitura foi ${config.enabled ? 'ativada' : 'desativada'}!`,
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363161513685998@newsletter',
                    newsletterName: 'KnightBot MD',
                    serverMessageId: -1
                }
            }
        });
        
    } catch (error) {
        console.error('Erro no comando autoread:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Erro ao processar o comando!',
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363161513685998@newsletter',
                    newsletterName: 'KnightBot MD',
                    serverMessageId: -1
                }
            }
        });
    }
}

// Função para verificar se autoleitura está ativada
function isAutoreadEnabled() {
    try {
        const config = initConfig();
        return config.enabled;
    } catch (error) {
        console.error('Erro ao verificar status da autoleitura:', error);
        return false;
    }
}

// Função para verificar se o bot foi mencionado em uma mensagem
function isBotMentionedInMessage(message, botNumber) {
    if (!message.message) return false;
    
    // Verifica menções em contextInfo (funciona para todos os tipos de mensagem)
    const messageTypes = [
        'extendedTextMessage', 'imageMessage', 'videoMessage', 'stickerMessage',
        'documentMessage', 'audioMessage', 'contactMessage', 'locationMessage'
    ];
    
    // Verifica menções explícitas no array mentionedJid
    for (const type of messageTypes) {
        if (message.message[type]?.contextInfo?.mentionedJid) {
            const mentionedJid = message.message[type].contextInfo.mentionedJid;
            if (mentionedJid.some(jid => jid === botNumber)) {
                return true;
            }
        }
    }
    
    // Verifica menções no texto em vários tipos de mensagem
    const textContent = 
        message.message.conversation || 
        message.message.extendedTextMessage?.text ||
        message.message.imageMessage?.caption ||
        message.message.videoMessage?.caption || '';
    
    if (textContent) {
        // Verifica formato de @menção
        const botUsername = botNumber.split('@')[0];
        if (textContent.includes(`@${botUsername}`)) {
            return true;
        }
        
        // Verifica menções pelo nome do bot (opcional, pode ser personalizado)
        const botNames = [global.botname?.toLowerCase(), 'bot', 'knight', 'knight bot'];
        const words = textContent.toLowerCase().split(/\s+/);
        if (botNames.some(name => words.includes(name))) {
            return true;
        }
    }
    
    return false;
}

// Função para lidar com a funcionalidade de autoleitura
async function handleAutoread(sock, message) {
    if (isAutoreadEnabled()) {
        // Obtém o ID do bot
        const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        
        // Verifica se o bot foi mencionado
        const isBotMentioned = isBotMentionedInMessage(message, botNumber);
        
        // Se o bot foi mencionado, lê a mensagem internamente mas não marca como lida na interface
        if (isBotMentioned) {
            
            // Não chamamos sock.readMessages() aqui, então a mensagem permanece não lida na interface
            return false; // Indica que a mensagem não foi marcada como lida
        } else {
            // Para mensagens normais, marca como lida normalmente
            const key = { remoteJid: message.key.remoteJid, id: message.key.id, participant: message.key.participant };
            await sock.readMessages([key]);
            //console.log('✅ Mensagem marcada como lida de ' + (message.key.participant || message.key.remoteJid).split('@')[0]);
            return true; // Indica que a mensagem foi marcada como lida
        }
    }
    return false; // Autoleitura está desativada
}

module.exports = {
    autoreadCommand,
    isAutoreadEnabled,
    isBotMentionedInMessage,
    handleAutoread
};