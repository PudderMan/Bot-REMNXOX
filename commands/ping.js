// commands/ping.js

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    // --- Dla komendy Slash ---
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Sprawdza opóźnienie bota.'),

    // --- Dla komendy z Prefixem ---
    name: 'ping',
    aliases: ['p'],
    isPrefixCommand: true, 

    async execute(context, args) {
        const replyText = `Czas odpowiedzi: ${context.client.ws.ping}ms.`;

        if (context.isChatInputCommand && context.isChatInputCommand()) {
            // Obsługa komendy Slash
            await context.reply({ content: replyText, ephemeral: true });
        } else {
            // Obsługa komendy z prefixem
            await context.reply(replyText);
        }
    },
};