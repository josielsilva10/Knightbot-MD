/**
 * Knight Bot - A WhatsApp Bot
 * Copyright (c) 2024 Professor
 * 
 * Este programa é software livre: você pode redistribuí-lo e/ou modificá-lo
 * sob os termos da Licença MIT.
 * 
 * Créditos:
 * - Biblioteca Baileys por @adiwajshing
 * - Implementação do Pair Code inspirada por TechGod143 & DGXEON
 */
require('dotenv').config();
require('./settings')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const chalk = require('chalk')
const FileType = require('file-type')
const path = require('path')
const axios = require('axios')
const { handleMessages, handleGroupParticipantUpdate, handleStatus } = require('./main');
const PhoneNumber = require('awesome-phonenumber')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch, await, sleep, reSize } = require('./lib/myfunc')
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    jidDecode,
    proto,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay
} = require("@whiskeysockets/baileys")
const NodeCache = require("node-cache")
// Usando uma store persistente leve em vez de makeInMemoryStore (compatibilidade entre versões)
const pino = require("pino")
const readline = require("readline")
const { parsePhoneNumber } = require("libphonenumber-js")
const { PHONENUMBER_MCC } = require('@whiskeysockets/baileys/lib/Utils/generics')
const { rmSync, existsSync } = require('fs')
const { join } = require('path')

// Importar store leve
const store = require('./lib/lightweight_store')

// Inicializar store
store.readFromFile()
const settings = require('./settings')
setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000)

// Otimização de memória - Forçar coleta de lixo se disponível
setInterval(() => {
    if (global.gc) {
        global.gc()
        console.log('🧹 Coleta de lixo concluída')
    }
}, 60_000) // a cada 1 minuto

// Monitoramento de memória - Reiniciar se RAM ficar muito alta
setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024
    if (used > 400) {
        console.log('⚠️ RAM muito alta (>400MB), reiniciando o bot...')
        process.exit(1) // Painel irá reiniciar automaticamente
    }
}, 30_000) // verifica a cada 30 segundos

let phoneNumber = "911234567890"
let owner = JSON.parse(fs.readFileSync('./data/owner.json'))

global.botname = "KNIGHT BOT"
global.themeemoji = "•"
const pairingCode = process.argv.includes("--pairing-code")
const useMobile = process.argv.includes("--mobile")

// Só cria interface readline se estivermos em ambiente interativo
const rl = process.stdin.isTTY ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null
const question = (text) => {
    if (rl) {
        return new Promise((resolve) => rl.question(text, resolve))
    } else {
        return Promise.resolve(settings.ownerNumber || phoneNumber)
    }
}


async function startXeonBotInc() {
    try {
        let { version, isLatest } = await fetchLatestBaileysVersion()
        const { state, saveCreds } = await useMultiFileAuthState(`./session`)
        const msgRetryCounterCache = new NodeCache()

        const XeonBotInc = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: !pairingCode,
            browser: ["Ubuntu", "Chrome", "20.0.04"],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
            },
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            getMessage: async (key) => {
                let jid = jidNormalizedUser(key.remoteJid)
                let msg = await store.loadMessage(jid, key.id)
                return msg?.message || ""
            },
            msgRetryCounterCache,
            defaultQueryTimeoutMs: 60000,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
        })

        // Salvar credenciais quando atualizarem
        XeonBotInc.ev.on('creds.update', saveCreds)

    store.bind(XeonBotInc.ev)

    // Manipulação de mensagens
    XeonBotInc.ev.on('messages.upsert', async chatUpdate => {
        try {
            const mek = chatUpdate.messages[0]
            if (!mek.message) return
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
            if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                await handleStatus(XeonBotInc, chatUpdate);
                return;
            }
            // Em modo privado, bloqueia apenas mensagens que não são de grupos (permite grupos para moderação)
            // Nota: XeonBotInc.public não é sincronizado, então checamos modo em main.js
            // Essa checagem é mantida para compatibilidade, mas bloqueia principalmente DMs
            if (!XeonBotInc.public && !mek.key.fromMe && chatUpdate.type === 'notify') {
                const isGroup = mek.key?.remoteJid?.endsWith('@g.us')
                if (!isGroup) return // Bloqueia DMs em modo privado, mas permite mensagens de grupo
            }
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return

            // Limpar cache de tentativas de mensagem para evitar consumo excessivo de memória
            if (XeonBotInc?.msgRetryCounterCache) {
                XeonBotInc.msgRetryCounterCache.clear()
            }

            try {
                await handleMessages(XeonBotInc, chatUpdate, true)
            } catch (err) {
                console.error("Erro em handleMessages:", err)
                // Tenta enviar mensagem de erro apenas se tivermos chatId válido
                if (mek.key && mek.key.remoteJid) {
                    await XeonBotInc.sendMessage(mek.key.remoteJid, {
                        text: '❌ Ocorreu um erro ao processar sua mensagem.',
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '120363161513685998@newsletter',
                                newsletterName: 'KnightBot MD',
                                serverMessageId: -1
                            }
                        }
                    }).catch(console.error);
                }
            }
        } catch (err) {
            console.error("Erro em messages.upsert:", err)
        }
    })

    // Adicionar esses handlers para melhor funcionalidade
    XeonBotInc.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }

    XeonBotInc.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = XeonBotInc.decodeJid(contact.id)
            if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
        }
    })

    XeonBotInc.getName = (jid, withoutContact = false) => {
        id = XeonBotInc.decodeJid(jid)
        withoutContact = XeonBotInc.withoutContact || withoutContact
        let v
        if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
            v = store.contacts[id] || {}
            if (!(v.name || v.subject)) v = XeonBotInc.groupMetadata(id) || {}
            resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
        })
        else v = id === '0@s.whatsapp.net' ? {
            id,
            name: 'WhatsApp'
        } : id === XeonBotInc.decodeJid(XeonBotInc.user.id) ?
            XeonBotInc.user :
            (store.contacts[id] || {})
        return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    }

    XeonBotInc.public = true

    XeonBotInc.serializeM = (m) => smsg(XeonBotInc, m, store)

    // Manipular código de pareamento
    if (pairingCode && !XeonBotInc.authState.creds.registered) {
        if (useMobile) throw new Error('Não é possível usar código de pareamento com API móvel')

        let phoneNumber
        if (!!global.phoneNumber) {
            phoneNumber = global.phoneNumber
        } else {
            phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`Por favor, digite seu número de WhatsApp 😍\nFormato: 6281376552730 (sem + ou espaços) : `)))
        }

        // Limpar o número de telefone - remover quaisquer caracteres não numéricos
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

        // Validar o número usando awesome-phonenumber
        const pn = require('awesome-phonenumber');
        if (!pn('+' + phoneNumber).isValid()) {
            console.log(chalk.red('Número de telefone inválido. Por favor, insira seu número internacional completo (ex: 15551234567 para EUA, 447911123456 para Reino Unido, etc.) sem + ou espaços.'));
            process.exit(1);
        }

        setTimeout(async () => {
            try {
                let code = await XeonBotInc.requestPairingCode(phoneNumber)
                code = code?.match(/.{1,4}/g)?.join("-") || code
                console.log(chalk.black(chalk.bgGreen(`Seu Código de Pareamento : `)), chalk.black(chalk.white(code)))
                console.log(chalk.yellow(`\nPor favor, insira este código no seu app WhatsApp:\n1. Abra o WhatsApp\n2. Vá em Configurações > Dispositivos Conectados\n3. Toque em "Conectar um dispositivo"\n4. Insira o código mostrado acima`))
            } catch (error) {
                console.error('Erro ao solicitar código de pareamento:', error)
                console.log(chalk.red('Falha ao obter código de pareamento. Verifique seu número e tente novamente.'))
            }
        }, 3000)
    }

    // Manipulação de conexão
    XeonBotInc.ev.on('connection.update', async (s) => {
        const { connection, lastDisconnect, qr } = s
        
        if (qr) {
            console.log(chalk.yellow('📱 Código QR gerado. Por favor, escaneie com o WhatsApp.'))
        }
        
        if (connection === 'connecting') {
            console.log(chalk.yellow('🔄 Conectando ao WhatsApp...'))
        }
        
        if (connection == "open") {
            console.log(chalk.magenta(` `))
            console.log(chalk.yellow(`🌿Conectado a => ` + JSON.stringify(XeonBotInc.user, null, 2)))

            try {
                const botNumber = XeonBotInc.user.id.split(':')[0] + '@s.whatsapp.net';
                await XeonBotInc.sendMessage(botNumber, {
                    text: `🤖 Bot conectado com sucesso!\n\n⏰ Hora: ${new Date().toLocaleString()}\n✅ Status: Online e pronto!\n\n✅Não esqueça de entrar no canal abaixo`,
                    contextInfo: {
                        forwardingScore: 1,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363161513685998@newsletter',
                            newsletterName: 'KnightBot MD',
                            serverMessageId: -1
                        }
                    }
                });
            } catch (error) {
                console.error('Erro ao enviar mensagem de conexão:', error.message)
            }

            await delay(1999)
            console.log(chalk.yellow(`\n\n                  ${chalk.bold.blue(`[ ${global.botname || 'KNIGHT BOT'} ]`)}\n\n`))
            console.log(chalk.cyan(`< ================================================== >`))
            console.log(chalk.magenta(`\n${global.themeemoji || '•'} CANAL YT: MR UNIQUE HACKER`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} GITHUB: mrunqiuehacker`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} NÚMERO WA: ${owner}`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} CRÉDITO: MR UNIQUE HACKER`))
            console.log(chalk.green(`${global.themeemoji || '•'} 🤖 Bot conectado com sucesso! ✅`))
            console.log(chalk.blue(`Versão do Bot: ${settings.version}`))
        }
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut
            const statusCode = lastDisconnect?.error?.output?.statusCode
            
            console.log(chalk.red(`Conexão encerrada devido a ${lastDisconnect?.error}, reconectando ${shouldReconnect}`))
            
            if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                try {
                    rmSync('./session', { recursive: true, force: true })
                    console.log(chalk.yellow('Pasta de sessão deletada. Por favor, reautentique-se.'))
                } catch (error) {
                    console.error('Erro ao deletar sessão:', error)
                }
                console.log(chalk.red('Sessão desconectada. Por favor, reautentique-se.'))
            }
            
            if (shouldReconnect) {
                console.log(chalk.yellow('Reconectando...'))
                await delay(5000)
                startXeonBotInc()
            }
        }
    })

    // Rastrear chamadas notificadas recentemente para evitar spam
    const antiCallNotified = new Set();

    // Handler anticall: bloqueia chamadores quando ativado
    XeonBotInc.ev.on('call', async (calls) => {
        try {
            const { readState: readAnticallState } = require('./commands/anticall');
            const state = readAnticallState();
            if (!state.enabled) return;
            for (const call of calls) {
                const callerJid = call.from || call.peerJid || call.chatId;
                if (!callerJid) continue;
                try {
                    // Primeiro: tentar rejeitar a chamada se suportado
                    try {
                        if (typeof XeonBotInc.rejectCall === 'function' && call.id) {
                            await XeonBotInc.rejectCall(call.id, callerJid);
                        } else if (typeof XeonBotInc.sendCallOfferAck === 'function' && call.id) {
                            await XeonBotInc.sendCallOfferAck(call.id, callerJid, 'reject');
                        }
                    } catch {}

                    // Notificar o chamador apenas uma vez dentro de uma janela curta
                    if (!antiCallNotified.has(callerJid)) {
                        antiCallNotified.add(callerJid);
                        setTimeout(() => antiCallNotified.delete(callerJid), 60000);
                        await XeonBotInc.sendMessage(callerJid, { text: '📵 Anticall está ativado. Sua chamada foi rejeitada e você será bloqueado.' });
                    }
                } catch {}
                // Depois: bloquear após um pequeno atraso para garantir rejeição e mensagem processadas
                setTimeout(async () => {
                    try { await XeonBotInc.updateBlockStatus(callerJid, 'block'); } catch {}
                }, 800);
            }
        } catch (e) {
            // ignorar
        }
    });

    XeonBotInc.ev.on('group-participants.update', async (update) => {
        await handleGroupParticipantUpdate(XeonBotInc, update);
    });

    XeonBotInc.ev.on('messages.upsert', async (m) => {
        if (m.messages[0].key && m.messages[0].key.remoteJid === 'status@broadcast') {
            await handleStatus(XeonBotInc, m);
        }
    });

    XeonBotInc.ev.on('status.update', async (status) => {
        await handleStatus(XeonBotInc, status);
    });

    XeonBotInc.ev.on('messages.reaction', async (status) => {
        await handleStatus(XeonBotInc, status);
    });

    return XeonBotInc
    } catch (error) {
        console.error('Erro em startXeonBotInc:', error)
        await delay(5000)
        startXeonBotInc()
    }
}


// Iniciar o bot com tratamento de erros
startXeonBotInc().catch(error => {
    console.error('Erro fatal:', error)
    process.exit(1)
})
process.on('uncaughtException', (err) => {
    console.error('Exceção não capturada:', err)
})

process.on('unhandledRejection', (err) => {
    console.error('Rejeição não tratada:', err)
})

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Atualizado ${__filename}`))
    delete require.cache[file]
    require(file)
})