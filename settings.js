const settings = {
  packname: 'Knight Bot',
  author: '‎',
  botName: "Cavaleiro bot",
  botOwner: 'Josiel DEV', // Seu nome
  ownerNumber: '5589981109051', // Defina seu número aqui sem o símbolo +, apenas código do país e número sem espaços
  giphyApiKey: 'qnl7ssQChTdPjsKta2Ax2LMaGXz303tq',
  geminiApiKey: process.env.GEMINI_API_KEY || 'SUA_CHAVE_AQUI',
  groqApiKey: process.env.GROQ_API_KEY || 'SUA_CHAVE_AQUI',
  commandMode: "public",
  maxStoreMessages: 20, 
  storeWriteInterval: 10000,
  description: "Este é um bot para gerenciar comandos de grupo e automatizar tarefas.",
  version: "3.0.7",
  updateZipUrl: "https://github.com/josielsilva10/Knightbot-MD/archive/refs/heads/main.zip",
};

module.exports = settings;
