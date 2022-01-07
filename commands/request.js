const { SlashCommandBuilder, inlineCode } = require('@discordjs/builders');
const { database } = require('../config.json');
var mysql = require('mysql');



module.exports = {
	data: new SlashCommandBuilder()
		.setName('request')
		.setDescription('Adds a request to the list')
		.addStringOption(option =>
			option.setName('name')
				.setDescription('The name of the request')
				.setRequired(true)),
	async execute(interaction) {
		var connection = mysql.createConnection(database);

		var request = {
			request_name: interaction.options.getString('name'),
			discord_id: interaction.member.id,
			filled: 0
		}

		var request_id = 0;
		connection.connect();
		var query = connection.query('INSERT INTO requests SET ?', request, function (error, results, fields) {
			if (error) throw error;
			request_id = results.insertId;
		});
		const name = inlineCode(request.request_name);
		const message = await interaction.reply({content :'You have requested ' + name + '.', fetchReply: true});
		connection.end();

/*
		const undoEmoji = '↩️';
		message.react(undoEmoji);
		const filter = (reaction) => {
			return reaction.emoji.name === '↩️';
		};
		message.awaitReactions({ filter, max: 1, time: 10000, errors: ['time']})
			.then(collected => {
				const reaction = collected.first(); 
				console.log(reaction);
				if (reaction.emoji.name === '↩️') {
					connection.query('DELETE FROM requests WHERE id = ?', request_id, function (error, results, fields) {
						if (error) throw error;
					});
					interaction.deleteReply();
				}
			})
			.catch();
			*/

	},
};
