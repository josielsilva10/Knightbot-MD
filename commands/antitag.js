const { setAntitag, getAntitag, removeAntitag } = require('../lib/index');
const isAdmin = require('../lib/isAdmin');

async function handleAntitagCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message) {
    try {
        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { text: '```Apenas para administradores do grupo!```' },{quoted :message});
            return;
        }

        const prefix = '.';
        const args = userMessage.slice(9).toLowerCase().trim().split(' ');
        const action = args[0];

        if (!action) {
            const usage = `\`\`\`CONFIGURAÇÃO ANTITAG\n\n${prefix}antitag on\n${prefix}antitag set delete | kick\n${prefix}antitag off\n\`\`\``;
            await sock.sendMessage(chatId, { text: usage },{quoted :message});
            return;
        }

        switch (action) {
            case 'on':
                const existingConfig = await getAntitag(chatId, 'on');
                if (existingConfig?.enabled) {
                    await sock.sendMessage(chatId, { text: '*_Antitag já está ativado_*' },{quoted :message});
                    return;
                }
                const result = await setAntitag(chatId, 'on', 'delete');
                await sock.sendMessage(chatId, { 
                    text: result ? '*_Antitag foi ATIVADO_*' : '*_Falha ao ativar o Antitag_*' 
                },{quoted :message});
                break;

            case 'off':
                await removeAntitag(chatId, 'on');
                await sock.sendMessage(chatId, { text: '*_Antitag foi DESATIVADO_*' },{quoted :message});
                break;

            case 'set':
                if (args.length < 2) {
                    await sock.sendMessage(chatId, { 
                        text: `*_Por favor, especifique uma ação: ${prefix}antitag set delete | kick_*` 
                    },{quoted :message});
                    return;
                }
                const setAction = args[1];
                if (!['delete', 'kick'].includes(setAction)) {
                    await sock.sendMessage(chatId, { 
                        text: '*_Ação inválida. Escolha delete ou kick._*' 
                    },{quoted :message});
                    return;
                }
                const setResult = await setAntitag(chatId, 'on', setAction);
                await sock.sendMessage(chatId, { 
                    text: setResult ? `*_Ação do Antitag definida para ${setAction}_*` : '*_Falha ao definir a ação do Antitag_*' 
                },{quoted :message});
                break;

            case 'get':
                const status = await getAntitag(chatId, 'on');
                const actionConfig = await getAntitag(chatId, 'on');
                await sock.sendMessage(chatId, { 
                    text: `*_Configuração do Antitag:_*\nStatus: ${status ? 'ATIVADO' : 'DESATIVADO'}\nAção: ${actionConfig ? actionConfig.action : 'Não definida'}` 
                },{quoted :message});
                break;

            default:
                await sock.sendMessage(chatId, { text: `*_Use ${prefix}antitag para ver o uso._*` },{quoted :message});
        }
    } catch (error) {
        console.error('Erro no comando antitag:', error);
        await sock.sendMessage(chatId, { text: '*_Erro ao processar o comando antitag_*' },{quoted :message});
    }
}

async function handleTagDetection(sock, chatId, message, senderId) {
    try {
        const antitagSetting = await getAntitag(chatId, 'on');
        if (!antitagSetting || !antitagSetting.enabled) return;

        // Obter JIDs mencionados do contextInfo (menções corretas)
        const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        
        // Extrair texto de todos os tipos possíveis de mensagem
        const messageText = (
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            message.message?.imageMessage?.caption ||
            message.message?.videoMessage?.caption ||
            ''
        );

        // Encontrar todas as @menções no texto usando regex aprimorado
        // Exemplos: @123456789, @⁨+91 70239 51514⁩, @~.., @217875470114951, etc.
        const textMentions = messageText.match(/@[\d+\s\-()~.]+/g) || [];
        
        // Também capturar menções apenas numéricas (como @217875470114951)
        const numericMentions = messageText.match(/@\d{10,}/g) || [];
        
        // Combinar todas as menções e remover duplicatas
        const allMentions = [...new Set([...mentionedJids, ...textMentions, ...numericMentions])];
        
        // Contar menções numéricas únicas (padrões de tagall de bots)
        const uniqueNumericMentions = new Set();
        numericMentions.forEach(mention => {
            const numMatch = mention.match(/@(\d+)/);
            if (numMatch) uniqueNumericMentions.add(numMatch[1]);
        });
        
        // Contar menções do array mentionedJid (menções corretas do WhatsApp)
        const mentionedJidCount = mentionedJids.length;
        
        // Contar menções numéricas únicas encontradas no texto (padrão tagall de bot)
        const numericMentionCount = uniqueNumericMentions.size;
        
        // Usar a contagem maior (menções corretas ou menções baseadas em texto)
        // Isso garante capturar tanto menções padrão quanto padrões tagall de bots
        const totalMentions = Math.max(mentionedJidCount, numericMentionCount);

        // Verificar se é mensagem de grupo e tem múltiplas menções
        if (totalMentions >= 3) {
            // Obter participantes do grupo para verificar se está marcando a maioria/todos
            const groupMetadata = await sock.groupMetadata(chatId);
            const participants = groupMetadata.participants || [];
            
            // Se menções forem mais que 50% dos membros do grupo, considerar como tagall
            const mentionThreshold = Math.ceil(participants.length * 0.5);
            
            // Também verificar se há muitas menções numéricas no texto (padrão tagall de bots)
            // Isso captura bots que usam IDs numéricos em vez de menções corretas
            const hasManyNumericMentions = numericMentionCount >= 10 || 
                                          (numericMentionCount >= 5 && numericMentionCount >= mentionThreshold);
            
            // Acionar se: menções padrão excederem o limite OU muitas menções numéricas detectadas
            if (totalMentions >= mentionThreshold || hasManyNumericMentions) {
                
                const action = antitagSetting.action || 'delete';
                
                if (action === 'delete') {
                    // Apagar a mensagem
                    await sock.sendMessage(chatId, {
                        delete: {
                            remoteJid: chatId,
                            fromMe: false,
                            id: message.key.id,
                            participant: senderId
                        }
                    });
                    
                    // Enviar aviso
                    await sock.sendMessage(chatId, {
                        text: `⚠️ *Tagall Detectado!*.`
                    }, { quoted: message });
                    
                } else if (action === 'kick') {
                    // Primeiro apagar a mensagem
                    await sock.sendMessage(chatId, {
                        delete: {
                            remoteJid: chatId,
                            fromMe: false,
                            id: message.key.id,
                            participant: senderId
                        }
                    });

                    // Depois expulsar o usuário
                    await sock.groupParticipantsUpdate(chatId, [senderId], "remove");

                    // Enviar notificação
                    const usernames = [`@${senderId.split('@')[0]}`];
                    await sock.sendMessage(chatId, {
                        text: `🚫 *Antitag Detectado!*\n\n${usernames.join(', ')} foi expulso por marcar todos os membros.`,
                        mentions: [senderId]
                    }, { quoted: message });
                }
            }
        }
    } catch (error) {
        console.error('Erro na detecção de marcação:', error);
    }
}

module.exports = {
    handleAntitagCommand,
    handleTagDetection
};