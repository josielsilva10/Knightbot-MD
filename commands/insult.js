const insults = [
"Você é como uma nuvem. Quando você desaparece, o dia fica lindo!",
"Você traz tanta alegria para todos quando sai da sala!",
"Eu concordaria com você, mas aí nós dois estaríamos errados.",
"Você não é burro; você só tem má sorte ao pensar.",
"Seus segredos estão sempre seguros comigo. Eu nem sequer escuto eles.",
"Você é a prova de que até a evolução tira uma folga às vezes.",
"Você tem algo no queixo... não, o terceiro para baixo.",
"Você é como uma atualização de software. Sempre que te vejo, penso: 'Eu realmente preciso disso agora?'",
"Você traz felicidade para todos... sabe, quando você vai embora.",
"Você é como uma moeda—duas caras e não vale muito.",
"Você tem algo na cabeça... ah, deixa pra lá.",
"Você é a razão pela qual colocam instruções nas embalagens de shampoo.",
"Você é como uma nuvem. Sempre flutuando sem um propósito real.",
"Suas piadas são como leite vencido—azedas e difíceis de digerir.",
"Você é como uma vela ao vento... inútil quando as coisas ficam difíceis.",
"Você tem algo único—sua habilidade de irritar todo mundo igualmente.",
"Você é como um sinal de Wi-Fi—sempre fraco quando mais precisa.",
"Você é a prova de que nem todo mundo precisa de filtro para ser desagradável.",
"Sua energia é como um buraco negro—suga a vida da sala.",
"Você tem a cara perfeita para rádio.",
"Você é como um engarrafamento—ninguém te quer, mas aqui está você.",
"Você é como um lápis quebrado—inútil.",
"Suas ideias são tão originais, tenho certeza que já ouvi todas antes.",
"Você é a prova viva de que até erros podem ser produtivos.",
"Você não é preguiçoso; está apenas altamente motivado a não fazer nada.",
"Seu cérebro roda Windows 95—lento e ultrapassado.",
"Você é como um quebra-molas—ninguém gosta de você, mas todos têm que lidar com você.",
"Você é como uma nuvem de mosquitos—apenas irritante.",
"Você junta as pessoas... para falar sobre o quanto você é chato."
];

async function insultCommand(sock, chatId, message) {
    try {
        if (!message || !chatId) {
            console.log('Mensagem ou chatId inválidos:', { message, chatId });
            return;
        }

        let userToInsult;
        
        // Check for mentioned users
        if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            userToInsult = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }
        // Check for replied message
        else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToInsult = message.message.extendedTextMessage.contextInfo.participant;
        }
        
        if (!userToInsult) {
            await sock.sendMessage(chatId, { 
                text: 'Por favor, mencione alguém ou responda a mensagem deles para insultá-los!'
            });
            return;
        }

        const insult = insults[Math.floor(Math.random() * insults.length)];

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        await sock.sendMessage(chatId, { 
            text: `Ei @${userToInsult.split('@')[0]}, ${insult}`,
            mentions: [userToInsult]
        });
    } catch (error) {
        console.error('Erro no comando insult:', error);
        if (error.data === 429) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            try {
                await sock.sendMessage(chatId, { 
                    text: 'Por favor, tente novamente em alguns segundos.'
                });
            } catch (retryError) {
                console.error('Erro ao enviar mensagem de tentativa:', retryError);
            }
        } else {
            try {
                await sock.sendMessage(chatId, { 
                    text: 'Ocorreu um erro ao enviar o insulto.'
                });
            } catch (sendError) {
                console.error('Erro ao enviar mensagem de erro:', sendError);
            }
        }
    }
}

module.exports = { insultCommand };