import { Telegraf, session } from 'telegraf';
import config from 'config';
import { message } from 'telegraf/filters';
import { code } from 'telegraf/format';
import { ogg } from './ogg.js';
import { openai } from './openai.js'

//import OpenAI from 'openai';
//import fs from 'fs';
const INITIAL_SESSION = {
    messages: [],
};

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'));

bot.use(session());

bot.command('new', async(ctx) => {
    ctx.session = INITIAL_SESSION
    await ctx.reply('Жду вашего голосового или текстого сообщения')
});


bot.command('start', async (ctx) => {
    ctx.session = INITIAL_SESSION
    await ctx.reply('Жду вашего голосового или текстого сообщения')
    //await ctx.reply(JSON.stringify(ctx.message, null, 2));
})

bot.on(message('voice'), async ctx => {
    ctx.session ??= INITIAL_SESSION

    try {
        await ctx.reply(code('Сообщение принял. Жду ответа с сервера...'));
        const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
        const userId = String(ctx.message.from.id);
        const oggPath = await ogg.create(link.href, userId);
        const mp3Path = await ogg.toFlac(oggPath, userId);   //получили mp3 
        const text = await openai.transcriptionGoogle(mp3Path);   //получили текст из mp3
        //const text = await openai.transcriptionOpenAI(mp3Path);   //получили текст из mp3
        //const response = await openai.chat(text)
        await ctx.reply(code(`Ваш запрос: ${text}`));
        ctx.session.messages.push({role: openai.roles.USER, content: text});
        //const response = await openai.chat(ctx.session.messages);
        ctx.session.messages.push({role: openai.roles.ASSISTANT, content: response});

        //console.log(response);
        //await ctx.reply(response);
    } catch (e) {
        console.log('Error while recording voice', e.message)
    }
});

bot.on(message('text'), async ctx => {
    ctx.session ??= INITIAL_SESSION

    try {
        await ctx.reply(code('Сообщение принял. Жду ответа с сервера...'));

        ctx.session.messages.push({
            role: openai.roles.USER, 
            content: ctx.message.text
        });
        //const response = await openai.chat(ctx.session.messages);
        ctx.session.messages.push({role: openai.roles.ASSISTANT, content: response});
        //await ctx.reply(response);
    } catch (e) {
        console.log('Error while chat', e.message)
    }
});

bot.launch();
console.log('Server work');
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

