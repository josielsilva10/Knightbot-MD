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
const ytdl = require('@distube/ytdl-core');
const yts = require('youtube-yts');
const readline = require('readline');
const ffmpeg = require('fluent-ffmpeg')
const NodeID3 = require('node-id3')
const fs = require('fs');
const { fetchBuffer } = require("./myfunc2")
const ytM = require('node-youtube-music')
const { randomBytes } = require('crypto')
const ytIdRegex = /(?:youtube\.com\/\S*(?:(?:\/e(?:mbed))?\/|watch\?(?:\S*?&?v\=))|youtu\.be\/)([a-zA-Z0-9_-]{6,11})/
const path = require('path');

class YTDownloader {
    constructor() {
        this.tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(this.tmpDir)) {
            fs.mkdirSync(this.tmpDir, { recursive: true });
        }
    }

    /**
     * Verifica se é link do yt
     * @param {string|URL} url url do youtube
     * @returns Retorna true se for URL do YouTube.
     */
    static isYTUrl = (url) => {
        return ytIdRegex.test(url)
    }

    /**
     * VideoID da url
     * @param {string|URL} url para obter videoID
     * @returns 
     */
    static getVideoID = (url) => {
        if (!this.isYTUrl(url)) throw new Error('não é URL do YouTube')
        return ytIdRegex.exec(url)[1]
    }

    /**
     * @typedef {Object} IMetadata
     * @property {string} Title título da faixa
     * @property {string} Artist artista da faixa
     * @property {string} Image url da miniatura da faixa
     * @property {string} Album álbum da faixa
     * @property {string} Year data de lançamento da faixa
     */

    /**
     * Escreve tags de metadados da faixa
     * @param {string} filePath 
     * @param {IMetadata} Metadata 
     */
    static WriteTags = async (filePath, Metadata) => {
        NodeID3.write(
            {
                title: Metadata.Title,
                artist: Metadata.Artist,
                originalArtist: Metadata.Artist,
                image: {
                    mime: 'jpeg',
                    type: {
                        id: 3,
                        name: 'capa frontal',
                    },
                    imageBuffer: (await fetchBuffer(Metadata.Image)).buffer,
                    description: `Capa de ${Metadata.Title}`,
                },
                album: Metadata.Album,
                year: Metadata.Year || ''
            },
            filePath
        );
    }

    /**
     * 
     * @param {string} query 
     * @returns 
     */
    static search = async (query, options = {}) => {
        const search = await yts.search({ query, hl: 'id', gl: 'ID', ...options })
        return search.videos
    }

    /**
     * @typedef {Object} TrackSearchResult
     * @property {boolean} isYtMusic é da busca do YT Music?
     * @property {string} title título da música
     * @property {string} artist artista da música
     * @property {string} id ID do YouTube
     * @property {string} url URL do YouTube
     * @property {string} album álbum da música
     * @property {Object} duration duração da música {seconds, label}
     * @property {string} image arte da capa
     */

    /**
     * busca faixa com detalhes
     * @param {string} query 
     * @returns {Promise<TrackSearchResult[]>}
     */
    static searchTrack = (query) => {
        return new Promise(async (resolve, reject) => {
            try {
                let ytMusic = await ytM.searchMusics(query);
                let result = []
                for (let i = 0; i < ytMusic.length; i++) {
                    result.push({
                        isYtMusic: true,
                        title: `${ytMusic[i].title} - ${ytMusic[i].artists.map(x => x.name).join(' ')}`,
                        artist: ytMusic[i].artists.map(x => x.name).join(' '),
                        id: ytMusic[i].youtubeId,
                        url: 'https://youtu.be/' + ytMusic[i].youtubeId,
                        album: ytMusic[i].album,
                        duration: {
                            seconds: ytMusic[i].duration.totalSeconds,
                            label: ytMusic[i].duration.label
                        },
                        image: ytMusic[i].thumbnailUrl.replace('w120-h120', 'w600-h600')
                    })
                 
                }
                resolve(result)
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * @typedef {Object} MusicResult
     * @property {TrackSearchResult} meta metadados da música
     * @property {string} path caminho do arquivo
     */

    /**
     * Baixa música com metadados completos
     * @param {string|TrackSearchResult[]} query título da faixa que deseja baixar
     * @returns {Promise<MusicResult>} caminho do arquivo do resultado
     */
    static downloadMusic = async (query) => {
        try {
            const getTrack = Array.isArray(query) ? query : await this.searchTrack(query);
            const search = getTrack[0]//await this.searchTrack(query)
            const videoInfo = await ytdl.getInfo('https://www.youtube.com/watch?v=' + search.id, { lang: 'id' });
            let stream = ytdl(search.id, { filter: 'audioonly', quality: 140 });
            let songPath = `./XeonMedia/audio/${randomBytes(3).toString('hex')}.mp3`
            stream.on('error', (err) => console.log(err))

            const file = await new Promise((resolve) => {
                ffmpeg(stream)
                    .audioFrequency(44100)
                    .audioChannels(2)
                    .audioBitrate(128)
                    .audioCodec('libmp3lame')
                    .audioQuality(5)
                    .toFormat('mp3')
                    .save(songPath)
                    .on('end', () => resolve(songPath))
            });
            await this.WriteTags(file, { Title: search.title, Artist: search.artist, Image: search.image, Album: search.album, Year: videoInfo.videoDetails.publishDate.split('-')[0] });
            return {
                meta: search,
                path: file,
                size: fs.statSync(songPath).size
            }
        } catch (error) {
            throw new Error(error)
        }
    }

    /**
     * obtém URLs de vídeo para download
     * @param {string|URL} query videoID ou URL do YouTube
     * @param {string} quality 
     * @returns
     */
    static mp4 = async (query, quality = 134) => {
        try {
            if (!query) throw new Error('ID do vídeo ou URL do YouTube é obrigatório')
            const videoId = this.isYTUrl(query) ? this.getVideoID(query) : query
            const videoInfo = await ytdl.getInfo('https://www.youtube.com/watch?v=' + videoId, { lang: 'id' });
            const format = ytdl.chooseFormat(videoInfo.formats, { format: quality, filter: 'videoandaudio' })
            return {
                title: videoInfo.videoDetails.title,
                thumb: videoInfo.videoDetails.thumbnails.slice(-1)[0],
                date: videoInfo.videoDetails.publishDate,
                duration: videoInfo.videoDetails.lengthSeconds,
                channel: videoInfo.videoDetails.ownerChannelName,
                quality: format.qualityLabel,
                contentLength: format.contentLength,
                description:videoInfo.videoDetails.description,
                videoUrl: format.url
            }
        } catch (error) {
            throw error
        }
    }

    /**
     * Baixa YouTube para mp3
     * @param {string|URL} url link do YouTube para baixar em mp3
     * @param {IMetadata} metadata metadados da faixa
     * @param {boolean} autoWriteTags se true, escreve automaticamente as tags seguindo as informações do YouTube
     * @returns 
     */
    static mp3 = async (url, metadata = {}, autoWriteTags = false) => {
        try {
            if (!url) throw new Error('ID do vídeo ou URL do YouTube é obrigatório')
            url = this.isYTUrl(url) ? 'https://www.youtube.com/watch?v=' + this.getVideoID(url) : url
            const { videoDetails } = await ytdl.getInfo(url, { lang: 'id' });
            let stream = ytdl(url, { filter: 'audioonly', quality: 140 });
            let songPath = `./XeonMedia/audio/${randomBytes(3).toString('hex')}.mp3`

            let starttime;
            stream.once('response', () => {
                starttime = Date.now();
            });
            stream.on('progress', (chunkLength, downloaded, total) => {
                const percent = downloaded / total;
                const downloadedMinutes = (Date.now() - starttime) / 1000 / 60;
                const estimatedDownloadTime = (downloadedMinutes / percent) - downloadedMinutes;
                readline.cursorTo(process.stdout, 0);
                process.stdout.write(`${(percent * 100).toFixed(2)}% baixado `);
                process.stdout.write(`(${(downloaded / 1024 / 1024).toFixed(2)}MB de ${(total / 1024 / 1024).toFixed(2)}MB)\n`);
                process.stdout.write(`tempo decorrido: ${downloadedMinutes.toFixed(2)} minutos`);
                process.stdout.write(`, tempo estimado restante: ${estimatedDownloadTime.toFixed(2)} minutos `);
                readline.moveCursor(process.stdout, 0, -1);
                //let txt = `${bgColor(color('[FFMPEG]]', 'black'), '#38ef7d')} ${color(moment().format('DD/MM/YY HH:mm:ss'), '#A1FFCE')} ${gradient.summer('[Converting..]')} ${gradient.cristal(p.targetSize)} kb`
            });
            stream.on('end', () => process.stdout.write('\n\n'));
            stream.on('error', (err) => console.log(err))

            const file = await new Promise((resolve) => {
                ffmpeg(stream)
                    .audioFrequency(44100)
                    .audioChannels(2)
                    .audioBitrate(128)
                    .audioCodec('libmp3lame')
                    .audioQuality(5)
                    .toFormat('mp3')
                    .save(songPath)
                    .on('end', () => {
                        resolve(songPath)
                    })
            });
            if (Object.keys(metadata).length !== 0) {
                await this.WriteTags(file, metadata)
            }
            if (autoWriteTags) {
                await this.WriteTags(file, { Title: videoDetails.title, Album: videoDetails.author.name, Year: videoDetails.publishDate.split('-')[0], Image: videoDetails.thumbnails.slice(-1)[0].url })
            }
            return {
                meta: {
                    title: videoDetails.title,
                    channel: videoDetails.author.name,
                    seconds: videoDetails.lengthSeconds,
                    image: videoDetails.thumbnails.slice(-1)[0].url
                },
                path: file,
                size: fs.statSync(songPath).size
            }
        } catch (error) {
            throw error
        }
    }

    async mp3(url) {
        try {
            const info = await ytdl.getInfo(url);
            const audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });
            
            const fileName = `${Date.now()}.mp3`;
            const filePath = path.join(this.tmpDir, fileName);

            return new Promise((resolve, reject) => {
                const stream = ytdl(url, {
                    quality: 'highestaudio',
                    filter: 'audioonly'
                });

                ffmpeg(stream)
                    .audioBitrate(128)
                    .toFormat('mp3')
                    .save(filePath)
                    .on('end', () => {
                        resolve({
                            path: filePath,
                            meta: {
                                title: info.videoDetails.title,
                                thumbnail: info.videoDetails.thumbnails[0].url
                            }
                        });
                    })
                    .on('error', (err) => reject(err));
            });
        } catch (error) {
            console.error('Erro ao baixar áudio:', error);
            throw error;
        }
    }
}

module.exports = new YTDownloader();