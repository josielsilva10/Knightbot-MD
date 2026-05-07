const { handleGoodbye } = require('../lib/welcome');
const { isGoodByeOn, getGoodbye } = require('../lib/index');
const fetch = require('node-fetch');

async function goodbyeCommand(sock, chatId, message, match) {
    // Verifica se é um grupo
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { text: 'Este comando só pode ser usado em grupos.' });
        return;
    }

    // Extrai o texto do comando
    const text = message.message?.conversation || 
                message.message?.extendedTextMessage?.text || '';
    const matchText = text.split(' ').slice(1).join(' ');

    await handleGoodbye(sock, chatId, message, matchText);
}

async function handleLeaveEvent(sock, id, participants) {
    // Verifica se a despedida está ativada para este grupo
    const isGoodbyeEnabled = await isGoodByeOn(id);
    if (!isGoodbyeEnabled) return;

    // Obtém a mensagem de despedida personalizada
    const customMessage = await getGoodbye(id);

    // Obtém os metadados do grupo
    const groupMetadata = await sock.groupMetadata(id);
    const groupName = groupMetadata.subject;

    // Envia a mensagem de despedida para cada participante que saiu
    for (const participant of participants) {
        try {
            // Trata caso o participante seja um objeto ou não seja string
            const participantString = typeof participant === 'string' ? participant : (participant.id || participant.toString());
            const user = participantString.split('@')[0];
            
            // Obtém o nome exibido do usuário
            let displayName = user; // Padrão para número de telefone
            try {
                const contact = await sock.getBusinessProfile(participantString);
                if (contact && contact.name) {
                    displayName = contact.name;
                } else {
                    // Tenta obter dos participantes do grupo
                    const groupParticipants = groupMetadata.participants;
                    const userParticipant = groupParticipants.find(p => p.id === participantString);
                    if (userParticipant && userParticipant.name) {
                        displayName = userParticipant.name;
                    }
                }
            } catch (nameError) {
                console.log('Não foi possível obter o nome exibido, usando número de telefone');
            }
            
            // Processa a mensagem personalizada com variáveis
            let finalMessage;
            if (customMessage) {
                finalMessage = customMessage
                    .replace(/{user}/g, `@${displayName}`)
                    .replace(/{group}/g, groupName);
            } else {
                // Mensagem padrão caso não haja mensagem personalizada
                finalMessage = ` *@${displayName}* nunca sentiremos sua falta! `;
            }
            
            // Tenta enviar com imagem primeiro (sempre tenta imagens)
            try {
                // Obtém a foto de perfil do usuário
                let profilePicUrl = `https://img.pyrocdn.com/dbKUgahg.png`; // Avatar padrão
                try {
                    const profilePic = await sock.profilePictureUrl(participantString, 'image');
                    if (profilePic) {
                        profilePicUrl = profilePic;
                    }
                } catch (profileError) {
                    console.log('Não foi possível obter a foto de perfil, usando padrão');
                }
                
                // Constrói a URL da API para a imagem de despedida
                const apiUrl = `https://api.some-random-api.com/welcome/img/2/gaming1?type=leave&textcolor=red&username=${encodeURIComponent(displayName)}&guildName=${encodeURIComponent(groupName)}&memberCount=${groupMetadata.participants.length}&avatar=${encodeURIComponent(profilePicUrl)}`;
                
                // Busca a imagem de despedida
                const response = await fetch(apiUrl);
                if (response.ok) {
                    const imageBuffer = await response.buffer();
                    
                    // Envia a imagem de despedida com legenda (mensagem personalizada ou padrão)
                    await sock.sendMessage(id, {
                        image: imageBuffer,
                        caption: finalMessage,
                        mentions: [participantString]
                    });
                    continue; // Pula para o próximo participante
                }
            } catch (imageError) {
                console.log('Falha na geração da imagem, enviando texto');
            }
            
            // Envia mensagem de texto (personalizada ou fallback)
            await sock.sendMessage(id, {
                text: finalMessage,
                mentions: [participantString]
            });
        } catch (error) {
            console.error('Erro ao enviar mensagem de despedida:', error);
            // Fallback para mensagem de texto
            const participantString = typeof participant === 'string' ? participant : (participant.id || participant.toString());
            const user = participantString.split('@')[0];
            
            // Usa mensagem personalizada se disponível, senão fallback simples
            let fallbackMessage;
            if (customMessage) {
                fallbackMessage = customMessage
                    .replace(/{user}/g, `@${user}`)
                    .replace(/{group}/g, groupName);
            } else {
                fallbackMessage = `Adeus @${user}! 👋`;
            }
            
            await sock.sendMessage(id, {
                text: fallbackMessage,
                mentions: [participantString]
            });
        }
    }
}

module.exports = { goodbyeCommand, handleLeaveEvent };