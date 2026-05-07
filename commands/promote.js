const { isAdmin } = require('../lib/isAdmin');

// Função para lidar com promoções manuais via comando
async function promoteCommand(sock, chatId, mentionedJids, message) {
    let userToPromote = [];
    
    // Verifica usuários mencionados
    if (mentionedJids && mentionedJids.length > 0) {
        userToPromote = mentionedJids;
    }
    // Verifica mensagem respondida
    else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToPromote = [message.message.extendedTextMessage.contextInfo.participant];
    }
    
    // Se nenhum usuário encontrado por qualquer método
    if (userToPromote.length === 0) {
        await sock.sendMessage(chatId, { 
            text: 'Por favor, mencione o usuário ou responda à mensagem dele para promover!'
        });
        return;
    }

    try {
        await sock.groupParticipantsUpdate(chatId, userToPromote, "promote");
        
        // Obtém nomes de usuário para cada usuário promovido
        const usernames = await Promise.all(userToPromote.map(async jid => {
            
            return `@${jid.split('@')[0]}`;
        }));

        // Obtém o nome do promotor (o usuário do bot neste caso)
        const promoterJid = sock.user.id;
        
        const promotionMessage = `*『 PROMOÇÃO NO GRUPO 』*\n\n` +
            `👥 *Usuário${userToPromote.length > 1 ? 's' : ''} promovido${userToPromote.length > 1 ? 's' : ''}:*\n` +
            `${usernames.map(name => `• ${name}`).join('\n')}\n\n` +
            `👑 *Promovido por:* @${promoterJid.split('@')[0]}\n\n` +
            `📅 *Data:* ${new Date().toLocaleString()}`;
        await sock.sendMessage(chatId, { 
            text: promotionMessage,
            mentions: [...userToPromote, promoterJid]
        });
    } catch (error) {
        console.error('Erro no comando promote:', error);
        await sock.sendMessage(chatId, { text: 'Falha ao promover usuário(s)!'});
    }
}

// Função para lidar com detecção automática de promoção
async function handlePromotionEvent(sock, groupId, participants, author) {
    try {
        // Verificação de segurança para participantes
        if (!Array.isArray(participants) || participants.length === 0) {
            return;
        }

        // Obtém nomes de usuário para participantes promovidos
        const promotedUsernames = await Promise.all(participants.map(async jid => {
            // Trata caso onde jid pode ser objeto ou não string
            const jidString = typeof jid === 'string' ? jid : (jid.id || jid.toString());
            return `@${jidString.split('@')[0]} `;
        }));

        let promotedBy;
        let mentionList = participants.map(jid => {
            // Garante que todas as menções sejam strings JID corretas
            return typeof jid === 'string' ? jid : (jid.id || jid.toString());
        });

        if (author && author.length > 0) {
            // Garante que o autor tenha o formato correto
            const authorJid = typeof author === 'string' ? author : (author.id || author.toString());
            promotedBy = `@${authorJid.split('@')[0]}`;
            mentionList.push(authorJid);
        } else {
            promotedBy = 'Sistema';
        }

        const promotionMessage = `*『 PROMOÇÃO NO GRUPO 』*\n\n` +
            `👥 *Usuário${participants.length > 1 ? 's' : ''} promovido${participants.length > 1 ? 's' : ''}:*\n` +
            `${promotedUsernames.map(name => `• ${name}`).join('\n')}\n\n` +
            `👑 *Promovido por:* ${promotedBy}\n\n` +
            `📅 *Data:* ${new Date().toLocaleString()}`;
        
        await sock.sendMessage(groupId, {
            text: promotionMessage,
            mentions: mentionList
        });
    } catch (error) {
        console.error('Erro ao lidar com evento de promoção:', error);
    }
}

module.exports = { promoteCommand, handlePromotionEvent };