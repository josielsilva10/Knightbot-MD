/**
 * Knight Bot - A WhatsApp Bot
 * Comando Autotyping - Mostra status falso de digitação
 */

const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');

// Caminho para armazenar a configuração
const configPath = path.join(__dirname, '..', 'data', 'autotyping.json');

// Inicializa o arquivo de configuração se não existir
function initConfig() {
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify({ enabled: false }, null, 2));
    }
    return JSON.parse(fs.readFileSync(configPath));
}

// Alterna o recurso de autotyping
async function autotypingCommand(sock, chatId, message) {
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

        // Obter argumentos do comando
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
                    text: '❌ Opção inválida! Use: .autotyping on/off',
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
            text: `✅ Autotyping foi ${config.enabled ? 'ativado' : 'desativado'}!`,
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
        console.error('Erro no comando autotyping:', error);
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

// Função para verificar se o autotyping está ativado
function isAutotypingEnabled() {
    try {
        const config = initConfig();
        return config.enabled;
    } catch (error) {
        console.error('Erro ao verificar status do autotyping:', error);
        return false;
    }
}

// Função para lidar com autotyping para mensagens comuns
async function handleAutotypingForMessage(sock, chatId, userMessage) {
    if (isAutotypingEnabled()) {
        try {
            // Primeiro se inscreve para atualizações de presença neste chat
            await sock.presenceSubscribe(chatId);
            
            // Envia status disponível primeiro
            await sock.sendPresenceUpdate('available', chatId);
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Depois envia status digitando
            await sock.sendPresenceUpdate('composing', chatId);
            
            // Simula tempo de digitação baseado no tamanho da mensagem com tempo mínimo aumentado
            const typingDelay = Math.max(3000, Math.min(8000, userMessage.length * 150));
            await new Promise(resolve => setTimeout(resolve, typingDelay));
            
            // Envia digitando novamente para garantir que fique visível
            await sock.sendPresenceUpdate('composing', chatId);
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Finalmente envia status pausado
            await sock.sendPresenceUpdate('paused', chatId);
            
            return true; // Indica que a digitação foi mostrada
        } catch (error) {
            console.error('❌ Erro ao enviar indicador de digitação:', error);
            return false; // Indica que a digitação falhou
        }
    }
    return false; // Autotyping está desativado
}

// Função para lidar com autotyping para comandos - ANTES da execução do comando (não usado mais)
async function handleAutotypingForCommand(sock, chatId) {
    if (isAutotypingEnabled()) {
        try {
            // Primeiro se inscreve para atualizações de presença neste chat
            await sock.presenceSubscribe(chatId);
            
            // Envia status disponível primeiro
            await sock.sendPresenceUpdate('available', chatId);
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Depois envia status digitando
            await sock.sendPresenceUpdate('composing', chatId);
            
            // Mantém indicador de digitação ativo para comandos com duração aumentada
            const commandTypingDelay = 3000;
            await new Promise(resolve => setTimeout(resolve, commandTypingDelay));
            
            // Envia digitando novamente para garantir que fique visível
            await sock.sendPresenceUpdate('composing', chatId);
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Finalmente envia status pausado
            await sock.sendPresenceUpdate('paused', chatId);
            
            return true; // Indica que a digitação foi mostrada
        } catch (error) {
            console.error('❌ Erro ao enviar indicador de digitação para comando:', error);
            return false; // Indica que a digitação falhou
        }
    }
    return false; // Autotyping está desativado
}

// Função para mostrar status de digitação APÓS execução do comando
async function showTypingAfterCommand(sock, chatId) {
    if (isAutotypingEnabled()) {
        try {
            // Esta função roda após o comando ter sido executado e resposta enviada
            // Então só precisamos mostrar um breve indicador de digitação
            
            // Inscreve para atualizações de presença
            await sock.presenceSubscribe(chatId);
            
            // Mostra status digitando brevemente
            await sock.sendPresenceUpdate('composing', chatId);
            
            // Mantém digitação visível por um curto período
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Depois pausa
            await sock.sendPresenceUpdate('paused', chatId);
            
            return true;
        } catch (error) {
            console.error('❌ Erro ao enviar indicador de digitação pós-comando:', error);
            return false;
        }
    }
    return false; // Autotyping está desativado
}

module.exports = {
    autotypingCommand,
    isAutotypingEnabled,
    handleAutotypingForMessage,
    handleAutotypingForCommand,
    showTypingAfterCommand
};