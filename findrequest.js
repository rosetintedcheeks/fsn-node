const { SlashCommandBuilder, inlineCode, codeBlock } = require('@discordjs/builders');
const { database, blutopiaApiKey } = require('../config.json');
const https = require('https');



module.exports = {
	data: new SlashCommandBuilder()
		.setName('findbooty')
		.setDescription('Looks for a file, and adds it to the server')
		.addStringOption(option =>
			option.setName('name')
				.setDescription('Name of file')
				.setRequired(false))
		.addStringOption(option =>
			option.setName('imdb')
				.setDescription('imdb id (tt#####)')
				.setRequired(false))
	,
	async execute(interaction) {
		var search = {
			name: interaction.options.getString('name'),
			imdb: interaction.options.getString('imdb'),
			api_token: blutopiaApiKey,
		}
		const path = '/api/torrents/filter?' 
			+ 'name=' + search.name + '&'
			//+ 'imdb=' + search.imdb + '&'
			+ 'api_token=' + search.api_token 
			;
		console.log(path);

		const options = {
			hostname: 'blutopia.xyz',
			port: 443,
			path: path,
			method: 'GET',
		}

		const req = https.request(options, res => {
			console.log(`statusCode: ${res.statusCode}`)

			res.on('data', d => {
				d.sort((a, b) => {
					
				})
				interaction.reply(codeBlock(

				))
			token})
		})

		req.on('error', error => {
			console.error(error)
		})

		req.end()
	},
};
