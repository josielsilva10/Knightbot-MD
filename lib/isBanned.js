const fs = require('fs');

function isBanned(userId) {
    try {
        const bannedUsers = JSON.parse(fs.readFileSync('./data/banned.json', 'utf8'));
        return bannedUsers.includes(userId);
    } catch (error) {
        console.error('Erro ao verificar status de banimento:', error);
        return false;
    }
}

module.exports = { isBanned }; 