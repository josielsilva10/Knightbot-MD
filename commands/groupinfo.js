async function groupInfoCommand(sock, chatId, msg) {
    try {
        // Get group metadata
        const groupMetadata = await sock.groupMetadata(chatId);
        
        // Get group profile picture
        let pp;
        try {
            pp = await sock.profilePictureUrl(chatId, 'image');
        } catch {
            pp = 'https://i.imgur.com/2wzGhpF.jpeg'; // Default image
        }

        // Get admins from participants
        const participants = groupMetadata.participants;
        const groupAdmins = participants.filter(p => p.admin);
        const listAdmin = groupAdmins.map((v, i) => `${i + 1}. @${v.id.split('@')[0]}`).join('\n');
        
        // Get group owner
        const owner = groupMetadata.owner || groupAdmins.find(p => p.admin === 'superadmin')?.id || chatId.split('-')[0] + '@s.whatsapp.net';

        // Create info text
        const text = `
┌──「 *INFORMAÇÕES DO GRUPO* 」
▢ *♻️ID:*
   • ${groupMetadata.id}
▢ *🔖NOME* : 
• ${groupMetadata.subject}
▢ *👥Membros* :
• ${participants.length}
▢ *🤿Dono do Grupo:*
• @${owner.split('@')[0]}
▢ *🕵🏻‍♂️Admins:*
${listAdmin}

▢ *📌Descrição* :
   • ${groupMetadata.desc?.toString() || 'Sem descrição'}
`.trim();

        // Send the message with image and mentions
        await sock.sendMessage(chatId, {
            image: { url: pp },
            caption: text,
            mentions: [...groupAdmins.map(v => v.id), owner]
        });

    } catch (error) {
        console.error('Erro no comando groupinfo:', error);
        await sock.sendMessage(chatId, { text: 'Falha ao obter informações do grupo!' });
    }
}

module.exports = groupInfoCommand; 