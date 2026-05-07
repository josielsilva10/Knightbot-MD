const fs = require('fs');
const isOwnerOrSudo = require('../lib/isOwner');

const PMBLOCKER_PATH = './data/pmblocker.json';

function readState() {
    try {
        if (!fs.existsSync(PMBLOCKER_PATH)) return { enabled: false, message: '⚠️ Mensagens diretas estão bloqueadas!\nVocê não pode enviar DM para este bot. Por favor, entre em contato com o dono apenas em grupos.' };
        const raw = fs.readFileSync(PMBLOCKER_PATH, 'utf8');
        const data = JSON.parse(raw || '{}');
        return {
            enabled: !!data.enabled,
            message: typeof data.message === 'string' && data.message.trim() ? data.message : '⚠️ Mensagens diretas estão bloqueadas!\nVocê não pode enviar DM para este bot. Por favor, entre em contato com o dono apenas em grupos.'
        };
    } catch {
        return { enabled: false, message: '⚠️ Mensagens diretas estão bloqueadas!\nVocê não pode enviar DM para este bot. Por favor, entre em contato com o dono apenas em grupos.' };
    }
}

function writeState(enabled, message) {
    try {
        if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
        const current = readState();
        const payload = {
            enabled: !!enabled,
            message: typeof message === 'string' && message.trim() ? message : current.message
        };
        fs.writeFileSync(PMBLOCKER_PATH, JSON.stringify(payload, null, 2));
    } catch {}
}

async function pmblockerCommand(sock, chatId, message, args) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
    
    if (!message.key.fromMe && !isOwner) {
        await sock.sendMessage(chatId, { text: 'Apenas o dono do bot pode usar este comando!' }, { quoted: message });
        return;
    }
    
    const argStr = (args || '').trim();
    const [sub, ...rest] = argStr.split(' ');
    const state = readState();

    if (!sub || !['on', 'off', 'status', 'setmsg'].includes(sub.toLowerCase())) {
        await sock.sendMessage(chatId, { text: '*PMBLOCKER (Apenas para o dono)*\n\n.pmblocker on - Ativar bloqueio automático de PM\n.pmblocker off - Desativar bloqueio de PM\n.pmblocker status - Mostrar status atual\n.pmblocker setmsg <texto> - Definir mensagem de aviso' }, { quoted: message });
        return;
    }

    if (sub.toLowerCase() === 'status') {
        await sock.sendMessage(chatId, { text: `Bloqueador de PM está atualmente *${state.enabled ? 'ATIVADO' : 'DESATIVADO'}*\nMensagem: ${state.message}` }, { quoted: message });
        return;
    }

    if (sub.toLowerCase() === 'setmsg') {
        const newMsg = rest.join(' ').trim();
        if (!newMsg) {
            await sock.sendMessage(chatId, { text: 'Uso: .pmblocker setmsg <mensagem>' }, { quoted: message });
            return;
        }
        writeState(state.enabled, newMsg);
        await sock.sendMessage(chatId, { text: 'Mensagem do Bloqueador de PM atualizada.' }, { quoted: message });
        return;
    }

    const enable = sub.toLowerCase() === 'on';
    writeState(enable);
    await sock.sendMessage(chatId, { text: `Bloqueador de PM está agora *${enable ? 'ATIVADO' : 'DESATIVADO'}*.` }, { quoted: message });
}

module.exports = { pmblockerCommand, readState };