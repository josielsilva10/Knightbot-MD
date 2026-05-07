// isAdmin.js
async function isAdmin(sock, chatId, senderId) {
    try {
        const metadata = await sock.groupMetadata(chatId);
        const participants = metadata.participants || [];

        // Extract bot's pure phone number
        const botId = sock.user?.id || '';
        const botLid = sock.user?.lid || '';
        const botNumber = botId.includes(':') ? botId.split(':')[0] : (botId.includes('@') ? botId.split('@')[0] : botId);
        const botIdWithoutSuffix = botId.includes('@') ? botId.split('@')[0] : botId;
        
        // Extract numeric part from bot LID (remove session identifier like :4)
        // botLid format: "30997433344120:4@lid" -> extract "30997433344120"
        const botLidNumeric = botLid.includes(':') ? botLid.split(':')[0] : (botLid.includes('@') ? botLid.split('@')[0] : botLid);
        const botLidWithoutSuffix = botLid.includes('@') ? botLid.split('@')[0] : botLid;

        const senderNumber = senderId.includes(':') ? senderId.split(':')[0] : (senderId.includes('@') ? senderId.split('@')[0] : senderId);
        const senderIdWithoutSuffix = senderId.includes('@') ? senderId.split('@')[0] : senderId;

        // Verifica se o bot é admin
        const isBotAdmin = participants.some(p => {
            // Verifica múltiplos formatos possíveis de ID
            const pPhoneNumber = p.phoneNumber ? p.phoneNumber.split('@')[0] : '';
            const pId = p.id ? p.id.split('@')[0] : '';
            const pLid = p.lid ? p.lid.split('@')[0] : '';
            const pFullId = p.id || '';
            const pFullLid = p.lid || '';
            
            // Extrai parte numérica do LID do participante (remove identificador de sessão se presente)
            const pLidNumeric = pLid.includes(':') ? pLid.split(':')[0] : pLid;
            
            // Compara com o ID do bot de várias formas
            const botMatches = (
                botId === pFullId || // Correspondência direta de ID
                botId === pFullLid || // Correspondência direta de LID (novo formato Baileys)
                botLid === pFullLid || // LID do bot vs LID do participante (correspondência completa)
                botLidNumeric === pLidNumeric || // LID numérico do bot vs LID numérico do participante (CORREÇÃO DE CHAVE)
                botLidWithoutSuffix === pLid || // LID do bot sem sufixo vs LID do participante
                botNumber === pPhoneNumber || // Correspondência de número de telefone
                botNumber === pId || // Correspondência da parte do ID
                botIdWithoutSuffix === pPhoneNumber || // Telefone do ID do bot vs telefone do participante
                botIdWithoutSuffix === pId || // Telefone do ID do bot vs ID do participante
                (botLid && botLid.split('@')[0].split(':')[0] === pLid) // Correspondência da parte numérica do LID do bot
            );
            
            return botMatches && (p.admin === 'admin' || p.admin === 'superadmin');
        });

        // Verifica se o remetente é admin
        const isSenderAdmin = participants.some(p => {
            // Verifica múltiplos formatos possíveis de ID
            const pPhoneNumber = p.phoneNumber ? p.phoneNumber.split('@')[0] : '';
            const pId = p.id ? p.id.split('@')[0] : '';
            const pLid = p.lid ? p.lid.split('@')[0] : '';
            const pFullId = p.id || '';
            const pFullLid = p.lid || '';
            
            // Compara com o ID do remetente de várias formas
            const senderMatches = (
                senderId === pFullId || // Correspondência direta de ID
                senderId === pFullLid || // Correspondência direta de LID (novo formato Baileys)
                senderNumber === pPhoneNumber || // Correspondência de número de telefone
                senderNumber === pId || // Correspondência da parte do ID
                senderIdWithoutSuffix === pPhoneNumber || // Telefone do ID do remetente vs telefone do participante
                senderIdWithoutSuffix === pId || // Telefone do ID do remetente vs ID do participante
                (pLid && senderIdWithoutSuffix === pLid) // LID do remetente vs LID do participante
            );
            
            return senderMatches && (p.admin === 'admin' || p.admin === 'superadmin');
        });

        return { isSenderAdmin, isBotAdmin };
    } catch (err) {
        console.error('❌ Erro em isAdmin:', err);
        return { isSenderAdmin: false, isBotAdmin: false };
    }
}

module.exports = isAdmin;