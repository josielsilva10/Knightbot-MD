const isAdmin = require('../lib/isAdmin');

async function muteCommand(sock, chatId, senderId, message, durationInMinutes) {
    

    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
    if (!isBotAdmin) {
        await sock.sendMessage(chatId, { text: 'Por favor, torne o bot um administrador primeiro.' }, { quoted: message });
        return;
    }

    if (!isSenderAdmin) {
        await sock.sendMessage(chatId, { text: 'Apenas administradores do grupo podem usar o comando mute.' }, { quoted: message });
        return;
    }

    try {
        // Mute the group
        await sock.groupSettingUpdate(chatId, 'announcement');
        
        if (durationInMinutes !== undefined && durationInMinutes > 0) {
            const durationInMilliseconds = durationInMinutes * 60 * 1000;
            await sock.sendMessage(chatId, { text: `O grupo foi silenciado por ${durationInMinutes} minutos.` }, { quoted: message });
            
            // Set timeout to unmute after duration
            setTimeout(async () => {
                try {
                    await sock.groupSettingUpdate(chatId, 'not_announcement');
                    await sock.sendMessage(chatId, { text: 'O grupo foi desmutado.' });
                } catch (unmuteError) {
                    console.error('Erro ao desmutar o grupo:', unmuteError);
                }
            }, durationInMilliseconds);
        } else {
            await sock.sendMessage(chatId, { text: 'O grupo foi silenciado.' }, { quoted: message });
        }
    } catch (error) {
        console.error('Erro ao mutar/desmutar o grupo:', error);
        await sock.sendMessage(chatId, { text: 'Ocorreu um erro ao mutar/desmutar o grupo. Por favor, tente novamente.' }, { quoted: message });
    }
}

module.exports = muteCommand;