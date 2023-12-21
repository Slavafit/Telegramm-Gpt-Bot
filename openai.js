import OpenAI from 'openai';
import config from 'config';
import fs from 'fs';
import speech from '@google-cloud/speech';


const project_id = config.get('project_id');
const private_key = config.get('PRIVATE_KEY');
const client_email = config.get('client_email');

// Создание объекта аутентификации
const authClient = {
    credentials: {
        project_id: project_id,
        private_key: private_key,
        client_email: client_email,
    },
};

class OpenAi {
    roles = {
        ASSISTANT: 'assistant',
        USER: 'user',
        SYSTEM: 'system',
    }

    async chat(messages) {
        const openai = new OpenAI({
            apiKey: config.get('OPENAI_KEY')
          });
        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages,
            })
            console.log(response)
            return response.choices[0].message;
        } catch (err) {
            console.error('Error while chating:', err.message);
        }
    }

    // Функция для распознавания речи из аудиофайла
    async transcriptionGoogle(filePath) {
        // Создание клиента для Google Cloud Speech-to-Text
        const client = new speech.SpeechClient(authClient);
        const file = fs.readFileSync(filePath);

        const audioBytes = file.toString('base64');

        const audio = {
            content: audioBytes,
        };

        const config = {
            encoding: 'FLAC',
            sampleRateHertz: 48000,
            languageCode: 'en-US',
            alternativeLanguageCodes: ['es-ES', 'ru-RU' ],
        };

        const request = {
            audio: audio,
            config: config,
        };

        try {
            const [response] = await client.recognize(request);
            //console.log('response:', response);
            const transcription = response.results
                .map(result => result.alternatives[0].transcript)
                .join('\n');
                //console.log('Transcription:', transcription);
            return transcription;
        } catch (err) {
            console.error('Error while decoding to text:', err.message);
        }
    };

    async transcriptionOpenAI(filePath) {
        const openai = new OpenAI({
            apiKey: config.get('OPENAI_KEY')
          });
        try {
            const response = await openai.audio.transcriptions.create({
                file: fs.createReadStream(filePath),
                model:'whisper-1',
            })
            console.log('response.text:', response.text)
            if (response.status === 200) {
                return response.text;
               } else {
                throw new Error(`Transcription failed with status ${response.status}`);
               }
        } catch (e) {
            console.log('Error while transcription', e.message);
        }
    }

;}

export const openai = new OpenAi();