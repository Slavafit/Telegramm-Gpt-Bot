import axios from "axios";
import { createWriteStream } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import ffmpeg from "fluent-ffmpeg";
import installer from '@ffmpeg-installer/ffmpeg';
import { removeFile } from "./util.js";


const __dirname = dirname(fileURLToPath(import.meta.url));

class OggConverter {
    constructor() {
        ffmpeg.setFfmpegPath(installer.path)   //установка пути до конвертора ffmpeg
    }

    toFlac(input, output) {
        try {
            const outputPath = resolve(dirname(input), `${output}.flac`); // Получение пути до файла
            return new Promise((resolve, reject) => {
                ffmpeg(input)
                    .inputOptions(['-t 30']) // Опция для ограничения продолжительности (по вашему усмотрению)
                    .audioCodec('flac') // Указываем кодек для аудио (FLAC)
                    .output(outputPath)
                    .on('end', () => {
                        removeFile(input); // Удаляем исходный OGA
                        resolve(outputPath); // Создаем FLAC
                    })
                    .on('error', (err) => reject(err.message))
                    .run();
            });
        } catch (e) {
            console.log('Error while creating FLAC', e.message);
        }
    };

    toMp3(input, output) {
        try {
            const outputPath = resolve(dirname(input), `${output}.mp3`)  //получаю путь до файла
            return new Promise((resolve, reject) => {
                ffmpeg(input)
                    .inputOption('-t 30')
                    .output(outputPath)
                    .on('end', () => {
                        removeFile(input)   //удаляю ogg
                        resolve(outputPath)})   //создали mp3
                    .on('error', (err) => reject(err.message))
                    .run()
            });
        } catch (e) {
            console.log('Error while creating mp3', e.message);
        }
    }

    async create(url, filename) {
        try {
            const oggPath = resolve(__dirname, './voices', `${filename}.ogg`)
            const response = await axios(
                {
                method: 'GET',
                url,
                responseType: 'stream',
            });
            return new Promise((resolve) => {
                const stream = createWriteStream(oggPath)
                response.data.pipe(stream)
                stream.on('finish', () => resolve(oggPath))
            });
        } catch (e) {
            console.log('Error while creating ogg', e.message);
        }
    }

}

export const ogg = new OggConverter;