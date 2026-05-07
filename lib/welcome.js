const { addWelcome, delWelcome, isWelcomeOn, addGoodbye, delGoodBye, isGoodByeOn } = require('../lib/index');
const { delay } = require('@whiskeysockets/baileys');

async function handleWelcome(sock, chatId, message, match) {
    if (!match) {
        return sock.sendMessage(chatId, {
            text: `📥 *Configuração de Mensagem de Boas-Vindas*\n\n✅ *.welcome on* — Ativar mensagens de boas-vindas\n🛠️ *.welcome set Sua mensagem personalizada* — Definir uma mensagem de boas-vindas personalizada\n🚫 *.welcome off* — Desativar mensagens de boas-vindas\n\n*Variáveis Disponíveis:*\n• {user} - Menciona o novo membro\n• {group} - Mostra o nome do grupo\n• {description} - Mostra a descrição do grupo`,
            quoted: message
        });
    }

    const [command, ...args] = match.split(' ');
    const lowerCommand = command.toLowerCase();
    const customMessage = args.join(' ');

    if (lowerCommand === 'on') {
        if (await isWelcomeOn(chatId)) {
            return sock.sendMessage(chatId, { text: '⚠️ As mensagens de boas-vindas já estão *ativadas*.', quoted: message });
        }
        await addWelcome(chatId, true, 'Bem-vindo {user} ao {group}! 🎉');
        return sock.sendMessage(chatId, { text: '✅ Mensagens de boas-vindas *ativadas* com mensagem simples. Use *.welcome set [sua mensagem]* para personalizar.', quoted: message });
    }

    if (lowerCommand === 'off') {
        if (!(await isWelcomeOn(chatId))) {
            return sock.sendMessage(chatId, { text: '⚠️ As mensagens de boas-vindas já estão *desativadas*.', quoted: message });
        }
        await delWelcome(chatId);
        return sock.sendMessage(chatId, { text: '✅ Mensagens de boas-vindas *desativadas* para este grupo.', quoted: message });
    }

    if (lowerCommand === 'set') {
        if (!customMessage) {
            return sock.sendMessage(chatId, { text: '⚠️ Por favor, forneça uma mensagem de boas-vindas personalizada. Exemplo: *.welcome set Bem-vindo ao grupo!*', quoted: message });
        }
        await addWelcome(chatId, true, customMessage);
        return sock.sendMessage(chatId, { text: '✅ Mensagem de boas-vindas personalizada *definida com sucesso*.', quoted: message });
    }

    // If no valid command is provided
    return sock.sendMessage(chatId, {
        text: `❌ Comando inválido. Use:\n*.welcome on* - Ativar\n*.welcome set [mensagem]* - Definir mensagem personalizada\n*.welcome off* - Desativar`,
        quoted: message
    });
}

async function handleGoodbye(sock, chatId, message, match) {
    const lower = match?.toLowerCase();

    if (!match) {
        return sock.sendMessage(chatId, {
            text: `📤 *Configuração de Mensagem de Despedida*\n\n✅ *.goodbye on* — Ativar mensagens de despedida\n🛠️ *.goodbye set Sua mensagem personalizada* — Definir uma mensagem de despedida personalizada\n🚫 *.goodbye off* — Desativar mensagens de despedida\n\n*Variáveis Disponíveis:*\n• {user} - Menciona o membro que está saindo\n• {group} - Mostra o nome do grupo`,
            quoted: message
        });
    }

    if (lower === 'on') {
        if (await isGoodByeOn(chatId)) {
            return sock.sendMessage(chatId, { text: '⚠️ As mensagens de despedida já estão *ativadas*.', quoted: message });
        }
        await addGoodbye(chatId, true, 'Adeus {user} 👋');
        return sock.sendMessage(chatId, { text: '✅ Mensagens de despedida *ativadas* com mensagem simples. Use *.goodbye set [sua mensagem]* para personalizar.', quoted: message });
    }

    if (lower === 'off') {
        if (!(await isGoodByeOn(chatId))) {
            return sock.sendMessage(chatId, { text: '⚠️ As mensagens de despedida já estão *desativadas*.', quoted: message });
        }
        await delGoodBye(chatId);
        return sock.sendMessage(chatId, { text: '✅ Mensagens de despedida *desativadas* para este grupo.', quoted: message });
    }

    if (lower.startsWith('set ')) {
        const customMessage = match.substring(4);
        if (!customMessage) {
            return sock.sendMessage(chatId, { text: '⚠️ Por favor, forneça uma mensagem de despedida personalizada. Exemplo: *.goodbye set Adeus!*', quoted: message });
        }
        await addGoodbye(chatId, true, customMessage);
        return sock.sendMessage(chatId, { text: '✅ Mensagem de despedida personalizada *definida com sucesso*.', quoted: message });
    }

    // If no valid command is provided
    return sock.sendMessage(chatId, {
        text: `❌ Comando inválido. Use:\n*.goodbye on* - Ativar\n*.goodbye set [mensagem]* - Definir mensagem personalizada\n*.goodbye off* - Desativar`,
        quoted: message
    });
}

module.exports = { handleWelcome, handleGoodbye };
// This code handles welcome and goodbye messages in a WhatsApp group using the Baileys library.