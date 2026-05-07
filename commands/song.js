const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const { toAudio } = require('../lib/converter');

const AXIOS_DEFAULTS = {
	timeout: 60000,
	headers: {
		'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
		'Accept': 'application/json, text/plain, */*'
	}
};

async function tryRequest(getter, attempts = 3) {
	let lastError;
	for (let attempt = 1; attempt <= attempts; attempt++) {
		try {
			return await getter();
		} catch (err) {
			lastError = err;
			if (attempt < attempts) {
				await new Promise(r => setTimeout(r, 1000 * attempt));
			}
		}
	}
	throw lastError;
}

// EliteProTech API - Primary
async function getEliteProTechDownloadByUrl(youtubeUrl) {
	const apiUrl = `https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(youtubeUrl)}&format=mp3`;
	const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
	if (res?.data?.success && res?.data?.downloadURL) {
		return {
			download: res.data.downloadURL,
			title: res.data.title
		};
	}
	throw new Error('EliteProTech ytdown returned no download');
}

async function getYupraDownloadByUrl(youtubeUrl) {
	const apiUrl = `https://api.yupra.my.id/api/downloader/ytmp3?url=${encodeURIComponent(youtubeUrl)}`;
	const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
	if (res?.data?.success && res?.data?.data?.download_url) {
		return {
			download: res.data.data.download_url,
			title: res.data.data.title,
			thumbnail: res.data.data.thumbnail
		};
	}
	throw new Error('Yupra returned no download');
}

async function getOkatsuDownloadByUrl(youtubeUrl) {
	const apiUrl = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${encodeURIComponent(youtubeUrl)}`;
	const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
	// Okatsu response shape: { status, creator, title, format, thumb, duration, cached, dl }
	if (res?.data?.dl) {
		return {
			download: res.data.dl,
			title: res.data.title,
			thumbnail: res.data.thumb
		};
	}
	throw new Error('Okatsu ytmp3 returned no download');
}

async function songCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        if (!text) {
            await sock.sendMessage(chatId, { text: 'Uso: .song <nome da música ou link do YouTube>' }, { quoted: message });
            return;
        }

        let video;
        if (text.includes('youtube.com') || text.includes('youtu.be')) {
			video = { url: text };
        } else {
			const search = await yts(text);
			if (!search || !search.videos.length) {
                await sock.sendMessage(chatId, { text: 'Nenhum resultado encontrado.' }, { quoted: message });
                return;
            }
			video = search.videos[0];
        }

        // Informar usuário
        await sock.sendMessage(chatId, {
            image: { url: video.thumbnail },
            caption: `🎵 Baixando: *${video.title}*\n⏱ Duração: ${video.timestamp}`
        }, { quoted: message });

		// Tentar múltiplas APIs com fallback: EliteProTech -> Yupra -> Okatsu
		let audioData;
		let audioBuffer;
		let downloadSuccess = false;
		
		// Lista de métodos de API para tentar
		const apiMethods = [
			{ name: 'EliteProTech', method: () => getEliteProTechDownloadByUrl(video.url) },
			{ name: 'Yupra', method: () => getYupraDownloadByUrl(video.url) },
			{ name: 'Okatsu', method: () => getOkatsuDownloadByUrl(video.url) }
		];
		
		// Tentar cada API até conseguir baixar o áudio
		for (const apiMethod of apiMethods) {
			try {
				audioData = await apiMethod.method();
				const audioUrl = audioData.download || audioData.dl || audioData.url;
				
				if (!audioUrl) {
					console.log(`${apiMethod.name} não retornou URL de download, tentando próxima API...`);
					continue; // Tentar próxima API
				}
				
				// Tentar baixar o arquivo de áudio - arraybuffer primeiro
				try {
					const audioResponse = await axios.get(audioUrl, {
						responseType: 'arraybuffer',
						timeout: 90000,
						maxContentLength: Infinity,
						maxBodyLength: Infinity,
						decompress: true,
						validateStatus: s => s >= 200 && s < 400,
						headers: {
							'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
							'Accept': '*/*',
							'Accept-Encoding': 'identity'
						}
					});
					audioBuffer = Buffer.from(audioResponse.data);
					
					// Validar buffer
					if (audioBuffer && audioBuffer.length > 0) {
						downloadSuccess = true;
						break; // Sucesso! Sair do loop
					}
				} catch (downloadErr) {
					// Verificar se é erro 451 ou outro erro cliente/servidor
					const statusCode = downloadErr.response?.status || downloadErr.status;
					if (statusCode === 451) {
						console.log(`Download bloqueado (451) pelo ${apiMethod.name}, tentando próxima API...`);
						continue; // Tentar próxima API
					}
					
					// Tentar modo stream como fallback para essa URL
					try {
						const audioResponse = await axios.get(audioUrl, {
							responseType: 'stream',
							timeout: 90000,
							maxContentLength: Infinity,
							maxBodyLength: Infinity,
							validateStatus: s => s >= 200 && s < 400,
							headers: {
								'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
								'Accept': '*/*',
								'Accept-Encoding': 'identity'
							}
						});
						const chunks = [];
						await new Promise((resolve, reject) => {
							audioResponse.data.on('data', c => chunks.push(c));
							audioResponse.data.on('end', resolve);
							audioResponse.data.on('error', reject);
						});
						audioBuffer = Buffer.concat(chunks);
						
						if (audioBuffer && audioBuffer.length > 0) {
							downloadSuccess = true;
							break; // Sucesso! Sair do loop
						}
					} catch (streamErr) {
						// Modo stream também falhou, tentar próxima API
						const streamStatusCode = streamErr.response?.status || streamErr.status;
						if (streamStatusCode === 451) {
							console.log(`Download por stream bloqueado (451) pelo ${apiMethod.name}, tentando próxima API...`);
						} else {
							console.log(`Falha no download por stream do ${apiMethod.name}:`, streamErr.message);
						}
						continue; // Tentar próxima API
					}
				}
			} catch (apiErr) {
				// Chamada da API falhou, tentar próxima API
				console.log(`API ${apiMethod.name} falhou:`, apiErr.message);
				continue;
			}
		}
		
		// Se todas as APIs falharam, lançar erro
		if (!downloadSuccess || !audioBuffer) {
			throw new Error('Todas as fontes de download falharam. O conteúdo pode estar indisponível ou bloqueado em sua região.');
		}

		// Validar buffer
		if (!audioBuffer || audioBuffer.length === 0) {
			throw new Error('O buffer de áudio baixado está vazio');
		}

		// Detectar formato real do arquivo pela assinatura
		const firstBytes = audioBuffer.slice(0, 12);
		const hexSignature = firstBytes.toString('hex');
		const asciiSignature = firstBytes.toString('ascii', 4, 8);

		let actualMimetype = 'audio/mpeg';
		let fileExtension = 'mp3';
		let detectedFormat = 'desconhecido';

		// Verificar MP4/M4A (caixa ftyp)
		if (asciiSignature === 'ftyp' || hexSignature.startsWith('000000')) {
			// Verificar se é M4A (audio/mp4)
			const ftypBox = audioBuffer.slice(4, 8).toString('ascii');
			if (ftypBox === 'ftyp') {
				detectedFormat = 'M4A/MP4';
				actualMimetype = 'audio/mp4';
				fileExtension = 'm4a';
			}
		}
		// Verificar MP3 (tag ID3 ou sincronização de quadro MPEG)
		else if (audioBuffer.toString('ascii', 0, 3) === 'ID3' || 
		         (audioBuffer[0] === 0xFF && (audioBuffer[1] & 0xE0) === 0xE0)) {
			detectedFormat = 'MP3';
			actualMimetype = 'audio/mpeg';
			fileExtension = 'mp3';
		}
		// Verificar OGG/Opus
		else if (audioBuffer.toString('ascii', 0, 4) === 'OggS') {
			detectedFormat = 'OGG/Opus';
			actualMimetype = 'audio/ogg; codecs=opus';
			fileExtension = 'ogg';
		}
		// Verificar WAV
		else if (audioBuffer.toString('ascii', 0, 4) === 'RIFF') {
			detectedFormat = 'WAV';
			actualMimetype = 'audio/wav';
			fileExtension = 'wav';
		}
		else {
			// Padrão para M4A, pois a assinatura geralmente sugere isso
			actualMimetype = 'audio/mp4';
			fileExtension = 'm4a';
			detectedFormat = 'Desconhecido (padronizando para M4A)';
		}

		// Converter para MP3 se não for MP3
		let finalBuffer = audioBuffer;
		let finalMimetype = 'audio/mpeg';
		let finalExtension = 'mp3';

		if (fileExtension !== 'mp3') {
			try {
				finalBuffer = await toAudio(audioBuffer, fileExtension);
				if (!finalBuffer || finalBuffer.length === 0) {
					throw new Error('Conversão retornou buffer vazio');
				}
				finalMimetype = 'audio/mpeg';
				finalExtension = 'mp3';
			} catch (convErr) {
				throw new Error(`Falha ao converter ${detectedFormat} para MP3: ${convErr.message}`);
			}
		}

		// Enviar buffer como MP3
		await sock.sendMessage(chatId, {
			audio: finalBuffer,
			mimetype: finalMimetype,
			fileName: `${(audioData.title || video.title || 'song').replace(/[^\w\s-]/g, '')}.${finalExtension}`,
			ptt: false
		}, { quoted: message });

		// Limpeza: deletar arquivos temporários criados durante a conversão
		try {
			const tempDir = path.join(__dirname, '../temp');
			if (fs.existsSync(tempDir)) {
				const files = fs.readdirSync(tempDir);
				const now = Date.now();
				files.forEach(file => {
					const filePath = path.join(tempDir, file);
					try {
						const stats = fs.statSync(filePath);
						// Deletar arquivos temporários com mais de 10 segundos (arquivos temporários de conversão)
						if (now - stats.mtimeMs > 10000) {
							// Verificar se é arquivo temporário de áudio (mp3, m4a, ou arquivos com timestamp numérico do conversor)
							if (file.endsWith('.mp3') || file.endsWith('.m4a') || /^\d+\.(mp3|m4a)$/.test(file)) {
								fs.unlinkSync(filePath);
							}
						}
					} catch (e) {
						// Ignorar erros individuais de arquivo
					}
				});
			}
		} catch (cleanupErr) {
			// Ignorar erros na limpeza
		}

    } catch (err) {
        console.error('Erro no comando song:', err);
        
        // Fornecer mensagens de erro mais específicas
        let errorMessage = '❌ Falha ao baixar a música.';
        if (err.message && err.message.includes('blocked')) {
            errorMessage = '❌ Download bloqueado. O conteúdo pode estar indisponível em sua região ou devido a restrições legais.';
        } else if (err.response?.status === 451 || err.status === 451) {
            errorMessage = '❌ Conteúdo indisponível (451). Isso pode ser devido a restrições legais ou bloqueio regional.';
        } else if (err.message && err.message.includes('All download sources failed')) {
            errorMessage = '❌ Todas as fontes de download falharam. O conteúdo pode estar indisponível ou bloqueado.';
        }
        
        await sock.sendMessage(chatId, { 
            text: errorMessage 
        }, { quoted: message });
    }
}

module.exports = songCommand;