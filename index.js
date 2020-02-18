const Discord = require('discord.js');
const {
 prefix,
} = require('./config.json');
const ytdl = require('ytdl-core');

const client = new Discord.Client();

const queue = new Map();

client.once('ready', () => {
 console.log('Готов!');
 client.user.setActivity(`помощь: .help`, 'WATCHING');
});

client.once('reconnecting', () => {
 console.log('Переподключение!');
});

client.once('disconnect', () => {
 console.log('Отключился!');
});



client.on('message', async message => {
 if (message.author.bot) return;
 if (!message.content.startsWith(prefix)) return;

 const serverQueue = queue.get(message.guild.id);

//Команда
 if (message.content.startsWith(`.play`)) {
 execute(message, serverQueue);
 return;
 } else if (message.content.startsWith(`.skip`)) {
 skip(message, serverQueue);
 return;
 } else if (message.content.startsWith(`.stop`)) {
 stop(message, serverQueue);       
 return;
 } else if(message.content == `.authors`){ //команда от автора
 message.reply("author: haventsound - discord: haventsound#6082")
 return;
} else if(message.content == `.invite`){ //команда от автора
    let embed = new Discord.RichEmbed()
    .setAuthor(message.guild.name, message.guild.iconURL)
    .setDescription(`[Пригласить](https://discordapp.com/oauth2/authorize?client_id=679039925605236777&permissions=8&scope=bot)`)
    message.channel.send(embed)
    return;
 } else if(message.content == `.help`){ //команда от автора
    let embed2 = new Discord.RichEmbed()
    .setDescription(`**Команды бота**
    .play - Проиграть музыку.
    .stop - Остановить песню.
    .skip - Пропустить песню, если она в очереди.
    .invite - Пригласить бота на свой сервер.
    .authors - Разработчики бота.`)
    message.channel.send(embed2)
 return; 	 
 } else {
 message.channel.send('Ты ввел неправильную команду!')
 }
});

async function execute(message, serverQueue) {
 const args = message.content.split(' ');

 const voiceChannel = message.member.voiceChannel;
 if (!voiceChannel) return message.channel.send('Вы должны быть в голосовом канале, чтобы включить музыку!');
 const permissions = voiceChannel.permissionsFor(message.client.user);
 if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
 return message.channel.send('Мне нужны разрешения, чтобы присоединиться к вашему каналу!');
 }

 const songInfo = await ytdl.getInfo(args[1]);
 const song = {
 title: songInfo.title,
 url: songInfo.video_url,
 };

 if (!serverQueue) {
 const queueContruct = {
 textChannel: message.channel,
 voiceChannel: voiceChannel,
 connection: null,
 songs: [],
 volume: 5,
 playing: true,
 };

 queue.set(message.guild.id, queueContruct);

 queueContruct.songs.push(song);

 try {
 var connection = await voiceChannel.join();
 queueContruct.connection = connection;
 play(message.guild, queueContruct.songs[0]);
 } catch (err) {
 console.log(err);
 queue.delete(message.guild.id);
 return message.channel.send(err);
 }
 } else {
 serverQueue.songs.push(song);
 console.log(serverQueue.songs);
 return message.channel.send(`${song.title} был добавлен в очередь!`);
 }

}

function skip(message, serverQueue) {
 if (!message.member.voiceChannel) return message.channel.send('Вы должны быть в голосовом канале, чтобы пропустить музыку!');
 if (!serverQueue) return message.channel.send('ам нет песни, которую я мог бы пропустить!');
 serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
 if (!message.member.voiceChannel) return message.channel.send('Вы должны быть в голосовом канале, чтобы остановить музыку!');
 serverQueue.songs = [];
 serverQueue.connection.dispatcher.end();
}

function play(guild, song) {
 const serverQueue = queue.get(guild.id);
	
 if (!song) {
 serverQueue.voiceChannel.leave();
 queue.delete(guild.id);
 return;
 }

 const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
 .on('end', () => {
 console.log('Музыка закончилась!');
 serverQueue.songs.shift();
 play(guild, serverQueue.songs[0]);
 })
 .on('error', error => {
 console.error(error);
 });
 dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
}

client.login(process.env.BOT_TOKEN);