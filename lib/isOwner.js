const settings = require('../settings');
const { isSudo } = require('./index');

async function isOwnerOrSudo(senderId, sock = null, chatId = null) {
    const ownerJid = settings.ownerNumber + "@s.whatsapp.net";
    const ownerNumberClean = settings.ownerNumber.split(':')[0].split('@')[0];
    
    // Correspondência direta do JID
    if (senderId === ownerJid) {
        return true;
    }
    
    // Extrair partes numéricas do remetente
    const senderIdClean = senderId.split(':')[0].split('@')[0];
    const senderLidNumeric = senderId.includes('@lid') ? senderId.split('@')[0].split(':')[0] : '';
    
    // Verificar se o número de telefone do remetente corresponde ao número do proprietário
    if (senderIdClean === ownerNumberClean) {
        return true;
    }
    
    // Em grupos, verificar se o LID do remetente corresponde ao LID do bot (proprietário usa a mesma conta que o bot)
    if (sock && chatId && chatId.endsWith('@g.us') && senderId.includes('@lid')) {
        try {
            // Obter o LID numérico do bot
            const botLid = sock.user?.lid || '';
            const botLidNumeric = botLid.includes(':') ? botLid.split(':')[0] : (botLid.includes('@') ? botLid.split('@')[0] : botLid);
            
            // Verificar se o LID numérico do remetente corresponde ao LID numérico do bot
            if (senderLidNumeric && botLidNumeric && senderLidNumeric === botLidNumeric) {
                return true;
            }
            
            // Também verificar dados dos participantes para correspondência adicional
            const metadata = await sock.groupMetadata(chatId);
            const participants = metadata.participants || [];
            
            const participant = participants.find(p => {
                const pLid = p.lid || '';
                const pLidNumeric = pLid.includes(':') ? pLid.split(':')[0] : (pLid.includes('@') ? pLid.split('@')[0] : pLid);
                const pId = p.id || '';
                const pIdClean = pId.split(':')[0].split('@')[0];
                
                return (
                    p.lid === senderId || 
                    p.id === senderId ||
                    pLidNumeric === senderLidNumeric ||
                    pIdClean === senderIdClean ||
                    pIdClean === ownerNumberClean
                );
            });
            
            if (participant) {
                const participantId = participant.id || '';
                const participantLid = participant.lid || '';
                const participantIdClean = participantId.split(':')[0].split('@')[0];
                const participantLidNumeric = participantLid.includes(':') ? participantLid.split(':')[0] : (participantLid.includes('@') ? participantLid.split('@')[0] : participantLid);
                
                if (participantId === ownerJid || 
                    participantIdClean === ownerNumberClean ||
                    participantLidNumeric === botLidNumeric) {
                    return true;
                }
            }
        } catch (e) {
            console.error('❌ [isOwner] Erro ao verificar dados do participante:', e);
        }
    }
    
    // Verificar se o ID do remetente contém o número do proprietário (fallback)
    if (senderId.includes(ownerNumberClean)) {
        return true;
    }
    
    // Verificar status sudo
    try {
        return await isSudo(senderId);
    } catch (e) {
        console.error('❌ [isOwner] Erro ao verificar sudo:', e);
        return false;
    }
}

module.exports = isOwnerOrSudo;