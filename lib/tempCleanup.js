const fs = require('fs');
const path = require('path');

// Utilitário para limpar arquivos temporários
function cleanupTempFiles() {
    const tempDir = path.join(process.cwd(), 'temp');
    
    if (!fs.existsSync(tempDir)) {
        return;
    }
    
    fs.readdir(tempDir, (err, files) => {
        if (err) {
            console.error('Erro ao ler o diretório temporário:', err);
            return;
        }
        
        let cleanedCount = 0;
        const now = Date.now();
        const maxAge = 3 * 60 * 60 * 1000; // 3 horas
        
        files.forEach(file => {
            const filePath = path.join(tempDir, file);
            
            fs.stat(filePath, (err, stats) => {
                if (err) return;
                
                // Apagar arquivos com mais de 3 horas
                if (now - stats.mtimeMs > maxAge) {
                    fs.unlink(filePath, (err) => {
                        if (!err) {
                            cleanedCount++;
                            console.log(`🧹 Arquivo temporário limpo: ${file}`);
                        }
                    });
                }
            });
        });
        
        if (cleanedCount > 0) {
            console.log(`🧹 ${cleanedCount} arquivos temporários limpos`);
        }
    });
}

// Limpeza na inicialização
cleanupTempFiles();

// Limpeza a cada hora
setInterval(cleanupTempFiles, 60 * 60 * 1000);

module.exports = { cleanupTempFiles };