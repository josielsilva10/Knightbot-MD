class TicTacToe {
constructor(playerX = 'x', playerO = 'o') {
    this.playerX = playerX;
    this.playerO = playerO;
    this._currentTurn = false;
    this._x = 0;
    this._o = 0;
    this.turns = 0;
}

get board() {
    return this._x | this._o;
}

get currentTurn() {
    return this._currentTurn ? this.playerO : this.playerX;
}

get winner() {
    // Todas as combinações possíveis de vitória
    const winningPatterns = [
        0b111000000, // Linha superior
        0b000111000, // Linha do meio
        0b000000111, // Linha inferior
        0b100100100, // Coluna da esquerda
        0b010010010, // Coluna do meio
        0b001001001, // Coluna da direita
        0b100010001, // Diagonal do canto superior esquerdo
        0b001010100  // Diagonal do canto superior direito
    ];

    // Verifica os movimentos do X
    for (let pattern of winningPatterns) {
        if ((this._x & pattern) === pattern) {
            return this.playerX;
        }
    }

    // Verifica os movimentos do O
    for (let pattern of winningPatterns) {
        if ((this._o & pattern) === pattern) {
            return this.playerO;
        }
    }

    return null;
}

turn(player, pos) {
    // Se o jogo acabou ou posição inválida
    if (this.winner || pos < 0 || pos > 8) return -1;
    
    // Se a posição já está ocupada
    if ((this._x | this._o) & (1 << pos)) return 0;
    
    // Realiza a jogada
    const value = 1 << pos;
    if (this._currentTurn) {
        this._o |= value;
    } else {
        this._x |= value;
    }
    
    this._currentTurn = !this._currentTurn;
    this.turns++;
    return 1;
}

render() {
    return [...Array(9)].map((_, i) => {
        const bit = 1 << i;
        return this._x & bit ? 'X' : this._o & bit ? 'O' : i + 1;
    });
}
}

module.exports = TicTacToe; 