const settings = require("../settings");
async function aliveCommand(sock, chatId, message) {
    try {
        const message1 = `*🤖 Knight Bot está Ativo!*\n\n` +
                       `*Versão:* ${settings.version}\n` +
                       `*Status:* Online\n` +
                       `*Modo:* Público\n\n` +
                       `*🌟 Funcionalidades:*\n` +
                       `• Gerenciamento de Grupos\n` +
                       `• Proteção Antilink\n` +
                       `• Comandos Divertidos\n` +
                       `• E mais!\n\n` +
                       `Digite *.menu* para a lista completa de comandos`;

        await sock.sendMessage(chatId, {
            text: message1,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363161513685998@newsletter',
                    newsletterName: 'KnightBot MD',
                    serverMessageId: -1
                }
            }
        }, { quoted: message });
    } catch (error) {
        console.error('Erro no comando alive:', error);
        await sock.sendMessage(chatId, { text: 'O bot está ativo e funcionando!' }, { quoted: message });
    }
}

module.exports = aliveCommand;