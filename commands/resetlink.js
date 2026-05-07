async function resetlinkCommand(sock, chatId, senderId) {
    try {
        // Check if sender is admin
        const groupMetadata = await sock.groupMetadata(chatId);
        const isAdmin = groupMetadata.participants
            .filter(p => p.admin)
            .map(p => p.id)
            .includes(senderId);

        // Check if bot is admin
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotAdmin = groupMetadata.participants
            .filter(p => p.admin)
            .map(p => p.id)
            .includes(botId);

        if (!isAdmin) {
            await sock.sendMessage(chatId, { text: '❌ Apenas administradores podem usar este comando!' });
            return;
        }

        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { text: '❌ O bot precisa ser administrador para redefinir o link do grupo!' });
            return;
        }

        // Reset the group link
        const newCode = await sock.groupRevokeInvite(chatId);
        
        // Send the new link
        await sock.sendMessage(chatId, { 
            text: `✅ O link do grupo foi redefinido com sucesso\n\n📌 Novo link:\nhttps://chat.whatsapp.com/${newCode}`
        });

    } catch (error) {
        console.error('Erro no comando resetlink:', error);
        await sock.sendMessage(chatId, { text: 'Falha ao redefinir o link do grupo!' });
    }
}

module.exports = resetlinkCommand; 