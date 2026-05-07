const eightBallResponses = [
    "Sim, com certeza!",
    "De jeito nenhum!",
    "Pergunte novamente mais tarde.",
    "É certo.",
    "Muito duvidoso.",
    "Sem dúvida.",
    "Minha resposta é não.",
    "Os sinais indicam que sim."
];

async function eightBallCommand(sock, chatId, question) {
    if (!question) {
        await sock.sendMessage(chatId, { text: 'Por favor, faça uma pergunta!' });
        return;
    }

    const randomResponse = eightBallResponses[Math.floor(Math.random() * eightBallResponses.length)];
    await sock.sendMessage(chatId, { text: `🎱 ${randomResponse}` });
}

module.exports = { eightBallCommand };