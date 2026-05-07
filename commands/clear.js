async function clearCommand(sock, chatId) {
    try {
        const message = await sock.sendMessage(chatId, { text: 'Limpando mensagens do bot...' });
        const messageKey = message.key; // Get the key of the message the bot just sent
        
        // Now delete the bot's message
        await sock.sendMessage(chatId, { delete: messageKey });
        
    } catch (error) {
        console.error('Erro ao limpar mensagens:', error);
        await sock.sendMessage(chatId, { text: 'Ocorreu um erro ao limpar as mensagens.' });
    }
}

module.exports = { clearCommand };