const fs = require('fs');
const { Client, Collection, Intents } = require('discord.js');
const { token, database, guildId } = require('./config.json');
const { createAudioPlayer, getVoiceConnection, joinVoiceChannel, createAudioResource, VoiceConnectionStatus } = require('@discordjs/voice');
const { inlineCode } = require('@discordjs/builders');
var mysql = require('mysql');
const { connect } = require('http2');
const { scheduleJob } = require('node-schedule');
const youtubedl = require('youtube-dl-exec');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGES] });

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

client.once('ready', () => {
	console.log('Ready!');
});


const pool = mysql.createPool(database);
const player = createAudioPlayer();


var guild_config = [];
const query = pool.query('SELECT guild, announce_channel FROM guild_config', function (error, results, fields) {
	results.forEach(function(v) {
		guild_config.push({guild: v.guild, announce_channel: v.announce_channel});
	});
});


client.on('messageCreate', async (message) => {
	if(message.content == '!stop') {
		const voiceConnection = getVoiceConnection(message.guild.id);
		if(voiceConnection != null) {
			voiceConnection.disconnect();
		}

	}
	/*if(message.content.startsWith('https://vm.tiktok.com')) {
		var link = youtubedl(message.content, {
			output: '/home/oaks/tiktok/toks/%(id).%(ext)'
		});
		console.log(link);
	}*/
	
	const query = pool.query('SELECT command_name FROM sounds', function (error, results, fields) {
		results.forEach(function (res) {
			if ('!' + res.command_name == message.content) {
				const bigQuery = pool.query('SELECT * FROM sounds WHERE command_name = ?', res.command_name, function (error, results, fields) {
					if (results.length != 0){
						const voiceConnection = joinVoiceChannel({
							channelId: message.member.voice.channelId,
							guildId: message.guildId,
							adapterCreator: message.guild.voiceAdapterCreator,
						});
						voiceConnection.subscribe(player);
						voiceConnection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
							try {
								await Promise.race([
									entersState(voiceConnection, VoiceConnectionStatus.Signalling, 5_000),
									entersState(voiceConnection, VoiceConnectionStatus.Connecting, 5_000),
								]);
								// Seems to be reconnecting to a new channel - ignore disconnect
							} catch (error) {
								// Seems to be a real disconnect which SHOULDN'T be recovered from
								voiceConnection.destroy();
							}
						});
						const resource = createAudioResource('/srv/the-mega-site/storage/app/public/' + results[0].location);
						player.play(resource);
					}
				});
			}
		});
	});
});



client.on('voiceStateUpdate', async (oldState, newState) => {
	if (oldState.channelId == null && newState.channelId != null && newState.member.id != client.user.id) {
		// Someone joined a channel
		// Do we have a sound for them?
		var connection = mysql.createConnection(database);
		var query = connection.query('SELECT * FROM join_sounds WHERE discord_id = ? AND checked = 1', newState.id, function (error, results, fields) {
			if (results.length != 0){
				const randNum = Math.floor(Math.random() * results.length);
				const result = results[randNum];
				const voiceConnection = joinVoiceChannel({
					channelId: newState.channelId,
					guildId: newState.guild.id,
					adapterCreator: newState.guild.voiceAdapterCreator,
				});
				voiceConnection.subscribe(player);
				voiceConnection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
					try {
						await Promise.race([
							entersState(voiceConnection, VoiceConnectionStatus.Signalling, 5_000),
							entersState(voiceConnection, VoiceConnectionStatus.Connecting, 5_000),
						]);
						// Seems to be reconnecting to a new channel - ignore disconnect
					} catch (error) {
						// Seems to be a real disconnect which SHOULDN'T be recovered from
						try{
							voiceConnection.destroy();
						} catch(err) {

						}
					}
				});
				const resource = createAudioResource('/srv/the-mega-site/storage/app/public/' + result.location);
				player.play(resource);
			}
		});
	}
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		return interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

scheduleJob('*/5 * * * *', function() {
	const query = pool.query('SELECT id, request_name, filled, announced, discord_id FROM requests', function (error, results, fields) {
		const channel = client.channels.cache.get(guild_config[0].announce_channel);
		results.forEach(function(v) {
			if(v.filled == 1 && v.announced == 0) {
				// announce
				channel.send(`<@${v.discord_id}> ${inlineCode(v.request_name)} is on the server.`);
				const insertQuery = pool.query('UPDATE requests SET announced = 1 WHERE id = ?', v.id);
			}
		});
	});
	//const voiceConnection = getVoiceConnection(message.guild.id);
	//guild_config.forEach(function(v) {
		//client.
	//}
	//guild_config.forEach(function(v) {
		//const channel = client.channels.cache.get(v.announce_channel); // god i'm an idiot this doesn't actually work need a guild column in requests some day
		//channel.send('content');
	//});
});

process.on('beforeExit', () => {
	pool.end(function (err) {
		console.log(err);
	});
});

client.login(token);
