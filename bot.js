// bot.js

// Ładowanie zmiennych środowiskowych
require('dotenv').config(); 

const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const { loadCommands } = require('./commandLoader');

// Ustawienia z pliku .env
const TOKEN = process.env.DISCORD_TOKEN;
const PREFIX = process.env.COMMAND_PREFIX;
const CLIENT_ID = process.env.CLIENT_ID; // Pobieramy stąd

// Inicjalizacja klienta i wymagane uprawnienia (Intents)
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,           // Wymagane do komend slash
        GatewayIntentBits.GuildMessages,    // Do odczytu wiadomości
        GatewayIntentBits.MessageContent    // KLUCZOWE: Wymagane do komend z prefixem! Włączone w portalu deweloperskim.
    ]
});

// Zmienna do przechowywania komend (zarówno prefix, jak i slash)
client.commands = new Collection(); 

// --- Ładowanie Komend ---
loadCommands(client);

// Inicjalizacja REST API
const rest = new REST({ version: '10' }).setToken(TOKEN);

// Funkcja rejestrująca komendy Slash na Discordzie
async function registerSlashCommands() {
    if (!CLIENT_ID) {
        console.error('Błąd: Brak CLIENT_ID w pliku .env. Nie zarejestrowano komend slash.');
        return;
    }
    try {
        console.log(`Rozpoczynanie rejestracji ${client.slashCommandsData.length} komend slash...`);
        
        // Używamy Routes.applicationCommands do globalnej rejestracji
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: client.slashCommandsData },
        );

        console.log('Pomyślnie zarejestrowano komendy slash.');
    } catch (error) {
        console.error('Błąd podczas rejestracji komend slash:', error);
    }
}

// --- Obsługa Zdarzeń ---

// Zdarzenie gotowości klienta (używamy clientReady zamiast ready)
client.once('clientReady', () => {
    console.log(`Bot zalogowany jako ${client.user.tag}!`);
    client.user.setActivity('Świąteczne przygotowania!');
    
    // Rejestracja komend slash przy starcie
    registerSlashCommands(); 
});

// 1. Obsługa Komend Slash
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Błąd przy wykonywaniu komendy slash: /${interaction.commandName}`, error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'Wystąpił błąd podczas wykonywania tej komendy slash!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'Wystąpił błąd podczas wykonywania tej komendy slash!', ephemeral: true });
        }
    }
});

// 2. Obsługa Komend Z Prefixem
client.on('messageCreate', message => {
    // Ignoruj wiadomości od botów lub te bez prefixu
    if (!message.content.startsWith(PREFIX) || message.author.bot) return;

    // Parsowanie komendy
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);

    // Sprawdzenie, czy komenda ma być obsługiwana z prefixem (musi mieć flagę isPrefixCommand: true)
    if (!command || !command.isPrefixCommand) { 
        return;
    }

    try {
        // Dla komend z prefixem przekazujemy obiekt wiadomości i argumenty
        command.execute(message, args); 
    } catch (error) {
        console.error(`Błąd przy wykonywaniu komendy prefixowej: ${PREFIX}${commandName}`, error);
        message.reply('Wystąpił błąd podczas wykonywania tej komendy z prefixem!');
    }
});

// Obsługa błędów, które mogą przerwać aplikację (jak EPIPE)
process.on('unhandledRejection', error => {
	console.error('Wykryto Unhandled Promise Rejection:', error);
});

// Logowanie do Discorda
client.login(TOKEN).catch(err => {
    console.error("Błąd logowania (TOKEN lub Intents):", err.message);
});