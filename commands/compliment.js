const compliments = [
    "Você é incrível do jeito que você é!",
    "Você tem um ótimo senso de humor!",
    "Você é incrivelmente atencioso e gentil.",
    "Você é mais poderoso do que imagina.",
    "Você ilumina o ambiente!",
    "Você é um verdadeiro amigo.",
    "Você me inspira!",
    "Sua criatividade não tem limites!",
    "Você tem um coração de ouro.",
    "Você faz a diferença no mundo.",
    "Sua positividade é contagiante!",
    "Você tem uma ética de trabalho incrível.",
    "Você traz o melhor das pessoas.",
    "Seu sorriso ilumina o dia de todos.",
    "Você é tão talentoso em tudo que faz.",
    "Sua bondade torna o mundo um lugar melhor.",
    "Você tem uma perspectiva única e maravilhosa.",
    "Seu entusiasmo é realmente inspirador!",
    "Você é capaz de alcançar grandes coisas.",
    "Você sempre sabe como fazer alguém se sentir especial.",
    "Sua confiança é admirável.",
    "Você tem uma alma linda.",
    "Sua generosidade não conhece limites.",
    "Você tem um ótimo olhar para os detalhes.",
    "Sua paixão é verdadeiramente motivadora!",
    "Você é um ouvinte incrível.",
    "Você é mais forte do que pensa!",
    "Sua risada é contagiante.",
    "Você tem um dom natural para fazer os outros se sentirem valorizados.",
    "Você torna o mundo um lugar melhor só por estar nele."
];

async function complimentCommand(sock, chatId, message) {
    try {
        if (!message || !chatId) {
            console.log('Mensagem ou chatId inválidos:', { message, chatId });
            return;
        }

        let userToCompliment;
        
        // Check for mentioned users
        if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            userToCompliment = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }
        // Check for replied message
        else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToCompliment = message.message.extendedTextMessage.contextInfo.participant;
        }
        
        if (!userToCompliment) {
            await sock.sendMessage(chatId, { 
                text: 'Por favor, mencione alguém ou responda a mensagem dessa pessoa para elogiá-la!'
            });
            return;
        }

        const compliment = compliments[Math.floor(Math.random() * compliments.length)];

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        await sock.sendMessage(chatId, { 
            text: `Ei @${userToCompliment.split('@')[0]}, ${compliment}`,
            mentions: [userToCompliment]
        });
    } catch (error) {
        console.error('Erro no comando de elogio:', error);
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
                    text: 'Ocorreu um erro ao enviar o elogio.'
                });
            } catch (sendError) {
                console.error('Erro ao enviar mensagem de erro:', sendError);
            }
        }
    }
}

module.exports = { complimentCommand };