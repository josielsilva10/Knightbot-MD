const { bots } = require('../lib/antilink');
const { setAntilink, getAntilink, removeAntilink } = require('../lib/index');
const isAdmin = require('../lib/isAdmin');

async function handleAntilinkCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message) {
    try {
        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { text: '```Apenas para administradores do grupo!```' }, { quoted: message });
            return;
        }

        const prefix = '.';
        const args = userMessage.slice(9).toLowerCase().trim().split(' ');
        const action = args[0];

        if (!action) {
            const usage = `\`\`\`CONFIGURAÇÃO ANTILINK\n\n${prefix}antilink on\n${prefix}antilink set delete | kick | warn\n${prefix}antilink off\n\`\`\``;
            await sock.sendMessage(chatId, { text: usage }, { quoted: message });
            return;
        }

        switch (action) {
            case 'on':
                const existingConfig = await getAntilink(chatId, 'on');
                if (existingConfig?.enabled) {
                    await sock.sendMessage(chatId, { text: '*_Antilink já está ativado_*' }, { quoted: message });
                    return;
                }
                const result = await setAntilink(chatId, 'on', 'delete');
                await sock.sendMessage(chatId, { 
                    text: result ? '*_Antilink foi ATIVADO_*' : '*_Falha ao ativar o Antilink_*' 
                },{ quoted: message });
                break;

            case 'off':
                await removeAntilink(chatId, 'on');
                await sock.sendMessage(chatId, { text: '*_Antilink foi DESATIVADO_*' }, { quoted: message });
                break;

            case 'set':
                if (args.length < 2) {
                    await sock.sendMessage(chatId, { 
                        text: `*_Por favor, especifique uma ação: ${prefix}antilink set delete | kick | warn_*` 
                    }, { quoted: message });
                    return;
                }
                const setAction = args[1];
                if (!['delete', 'kick', 'warn'].includes(setAction)) {
                    await sock.sendMessage(chatId, { 
                        text: '*_Ação inválida. Escolha delete, kick ou warn._*' 
                    }, { quoted: message });
                    return;
                }
                const setResult = await setAntilink(chatId, 'on', setAction);
                await sock.sendMessage(chatId, { 
                    text: setResult ? `*_Ação do Antilink definida para ${setAction}_*` : '*_Falha ao definir ação do Antilink_*' 
                }, { quoted: message });
                break;

            case 'get':
                const status = await getAntilink(chatId, 'on');
                const actionConfig = await getAntilink(chatId, 'on');
                await sock.sendMessage(chatId, { 
                    text: `*_Configuração do Antilink:_*\nStatus: ${status ? 'ATIVADO' : 'DESATIVADO'}\nAção: ${actionConfig ? actionConfig.action : 'Não definida'}` 
                }, { quoted: message });
                break;

            default:
                await sock.sendMessage(chatId, { text: `*_Use ${prefix}antilink para ver o uso._*` });
        }
    } catch (error) {
        console.error('Erro no comando antilink:', error);
        await sock.sendMessage(chatId, { text: '*_Erro ao processar o comando antilink_*' });
    }
}

async function handleLinkDetection(sock, chatId, message, userMessage, senderId) {
    const antilinkSetting = getAntilinkSetting(chatId);
    if (antilinkSetting === 'off') return;

    console.log(`Configuração Antilink para ${chatId}: ${antilinkSetting}`);
    console.log(`Verificando mensagem por links: ${userMessage}`);
    
    // Log do objeto completo da mensagem para diagnosticar a estrutura da mensagem
    console.log("Objeto completo da mensagem: ", JSON.stringify(message, null, 2));

    let shouldDelete = false;

    const linkPatterns = {
        whatsappGroup: /chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/i,
        whatsappChannel: /wa\.me\/channel\/[A-Za-z0-9]{20,}/i,
        telegram: /t\.me\/[A-Za-z0-9_]+/i,
        // Detecta:
        // - URLs completas com protocolo (http/https)
        // - URLs começando com www.
        // - Domínios simples em qualquer parte da string, mesmo anexados a texto
        //   ex: "helloinstagram.comworld" ou "testhttps://x.com"
        allLinks: /https?:\/\/\S+|www\.\S+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?/i,
    };

    // Detecta links de grupos do WhatsApp
    if (antilinkSetting === 'whatsappGroup') {
        console.log('Proteção contra links de grupos do WhatsApp ativada.');
        if (linkPatterns.whatsappGroup.test(userMessage)) {
            console.log('Link de grupo do WhatsApp detectado!');
            shouldDelete = true;
        }
    } else if (antilinkSetting === 'whatsappChannel' && linkPatterns.whatsappChannel.test(userMessage)) {
        shouldDelete = true;
    } else if (antilinkSetting === 'telegram' && linkPatterns.telegram.test(userMessage)) {
        shouldDelete = true;
    } else if (antilinkSetting === 'allLinks' && linkPatterns.allLinks.test(userMessage)) {
        shouldDelete = true;
    }

    if (shouldDelete) {
        const quotedMessageId = message.key.id; // Pega o ID da mensagem para deletar
        const quotedParticipant = message.key.participant || senderId; // Pega o participante

        console.log(`Tentando deletar mensagem com id: ${quotedMessageId} do participante: ${quotedParticipant}`);

        try {
            await sock.sendMessage(chatId, {
                delete: { remoteJid: chatId, fromMe: false, id: quotedMessageId, participant: quotedParticipant },
            });
            console.log(`Mensagem com ID ${quotedMessageId} deletada com sucesso.`);
        } catch (error) {
            console.error('Falha ao deletar mensagem:', error);
        }

        const mentionedJidList = [senderId];
        await sock.sendMessage(chatId, { text: `Aviso! @${senderId.split('@')[0]}, postar links não é permitido.`, mentions: mentionedJidList });
    } else {
        console.log('Nenhum link detectado ou proteção não ativada para este tipo de link.');
    }
}

module.exports = {
    handleAntilinkCommand,
    handleLinkDetection,
};