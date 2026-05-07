async function unmuteCommand(sock, chatId) {
    await sock.groupSettingUpdate(chatId, 'not_announcement'); // Desmutar o grupo
    await sock.sendMessage(chatId, { text: 'O grupo foi desmutado.' });
}

module.exports = unmuteCommand;