const fs = require('fs');

function readJsonSafe(path, fallback) {
    try {
        const txt = fs.readFileSync(path, 'utf8');
        return JSON.parse(txt);
    } catch (_) {
        return fallback;
    }
}

const isOwnerOrSudo = require('../lib/isOwner');

async function settingsCommand(sock, chatId, message) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
        
        if (!message.key.fromMe && !isOwner) {
            await sock.sendMessage(chatId, { text: 'Apenas o dono do bot pode usar este comando!' }, { quoted: message });
            return;
        }

        const isGroup = chatId.endsWith('@g.us');
        const dataDir = './data';

        const mode = readJsonSafe(`${dataDir}/messageCount.json`, { isPublic: true });
        const autoStatus = readJsonSafe(`${dataDir}/autoStatus.json`, { enabled: false });
        const autoread = readJsonSafe(`${dataDir}/autoread.json`, { enabled: false });
        const autotyping = readJsonSafe(`${dataDir}/autotyping.json`, { enabled: false });
        const pmblocker = readJsonSafe(`${dataDir}/pmblocker.json`, { enabled: false });
        const anticall = readJsonSafe(`${dataDir}/anticall.json`, { enabled: false });
        const userGroupData = readJsonSafe(`${dataDir}/userGroupData.json`, {
            antilink: {}, antibadword: {}, welcome: {}, goodbye: {}, chatbot: {}, antitag: {}
        });
        const autoReaction = Boolean(userGroupData.autoReaction);

        // Per-group features
        const groupId = isGroup ? chatId : null;
        const antilinkOn = groupId ? Boolean(userGroupData.antilink && userGroupData.antilink[groupId]) : false;
        const antibadwordOn = groupId ? Boolean(userGroupData.antibadword && userGroupData.antibadword[groupId]) : false;
        const welcomeOn = groupId ? Boolean(userGroupData.welcome && userGroupData.welcome[groupId]) : false;
        const goodbyeOn = groupId ? Boolean(userGroupData.goodbye && userGroupData.goodbye[groupId]) : false;
        const chatbotOn = groupId ? Boolean(userGroupData.chatbot && userGroupData.chatbot[groupId]) : false;
        const antitagCfg = groupId ? (userGroupData.antitag && userGroupData.antitag[groupId]) : null;

        const lines = [];
        lines.push('*CONFIGURAÇÕES DO BOT*');
        lines.push('');
        lines.push(`• Modo: ${mode.isPublic ? 'Público' : 'Privado'}`);
        lines.push(`• Status Automático: ${autoStatus.enabled ? 'LIGADO' : 'DESLIGADO'}`);
        lines.push(`• Leitura Automática: ${autoread.enabled ? 'LIGADO' : 'DESLIGADO'}`);
        lines.push(`• Digitação Automática: ${autotyping.enabled ? 'LIGADO' : 'DESLIGADO'}`);
        lines.push(`• Bloqueio de PM: ${pmblocker.enabled ? 'LIGADO' : 'DESLIGADO'}`);
        lines.push(`• Antichamada: ${anticall.enabled ? 'LIGADO' : 'DESLIGADO'}`);
        lines.push(`• Reação Automática: ${autoReaction ? 'LIGADO' : 'DESLIGADO'}`);
        if (groupId) {
            lines.push('');
            lines.push(`Grupo: ${groupId}`);
            if (antilinkOn) {
                const al = userGroupData.antilink[groupId];
                lines.push(`• Antilink: LIGADO (ação: ${al.action || 'deletar'})`);
            } else {
                lines.push('• Antilink: DESLIGADO');
            }
            if (antibadwordOn) {
                const ab = userGroupData.antibadword[groupId];
                lines.push(`• Antipalavrões: LIGADO (ação: ${ab.action || 'deletar'})`);
            } else {
                lines.push('• Antipalavrões: DESLIGADO');
            }
            lines.push(`• Boas-vindas: ${welcomeOn ? 'LIGADO' : 'DESLIGADO'}`);
            lines.push(`• Despedida: ${goodbyeOn ? 'LIGADO' : 'DESLIGADO'}`);
            lines.push(`• Chatbot: ${chatbotOn ? 'LIGADO' : 'DESLIGADO'}`);
            if (antitagCfg && antitagCfg.enabled) {
                lines.push(`• Antitag: LIGADO (ação: ${antitagCfg.action || 'deletar'})`);
            } else {
                lines.push('• Antitag: DESLIGADO');
            }
        } else {
            lines.push('');
            lines.push('Nota: As configurações por grupo serão exibidas quando usadas dentro de um grupo.');
        }

        await sock.sendMessage(chatId, { text: lines.join('\n') }, { quoted: message });
    } catch (error) {
        console.error('Erro no comando de configurações:', error);
        await sock.sendMessage(chatId, { text: 'Falha ao ler as configurações.' }, { quoted: message });
    }
}

module.exports = settingsCommand;