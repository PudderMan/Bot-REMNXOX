// commandLoader.js

const fs = require('fs');
const path = require('path');

/**
 * Funkcja rekursywna skanująca katalogi i ładująca komendy.
 * @param {string} directory Ścieżka do katalogu
 * @param {Map<string, object>} commandsMap Mapa do przechowywania komend prefixowych
 * @param {object[]} slashCommands Tablica do przechowywania danych komend slash
 */
function walk(directory, commandsMap, slashCommands) {
    const files = fs.readdirSync(directory);

    for (const file of files) {
        const filePath = path.join(directory, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // Jeśli to katalog, wywołaj rekurencyjnie
            walk(filePath, commandsMap, slashCommands);
        } else if (file.endsWith('.js')) {
            // Jeśli to plik komendy (.js)
            const command = require(filePath);

            // Komendy z prefixem (muszą mieć właściwość 'name')
            if (command.name) {
                commandsMap.set(command.name, command);
                if (command.aliases && Array.isArray(command.aliases)) {
                    command.aliases.forEach(alias => commandsMap.set(alias, command));
                }
            }

            // Komendy Slash (muszą mieć właściwość 'data')
            if (command.data) {
                slashCommands.push(command.data.toJSON());
            }
        }
    }
}

/**
 * Ładuje komendy z głównego katalogu 'commands' i wszystkich podkatalogów.
 * @param {import('discord.js').Client} client Klient Discord
 */
function loadCommands(client) {
    const rootCommandsDir = path.join(__dirname, 'commands');
    const commandsMap = new Map();
    const slashCommands = [];

    if (!fs.existsSync(rootCommandsDir)) {
        console.log(`Błąd: Nie znaleziono głównego katalogu komend: ${rootCommandsDir}`);
        return;
    }
    
    // Rozpoczęcie skanowania rekurencyjnego
    walk(rootCommandsDir, commandsMap, slashCommands);

    client.commands = commandsMap;
    client.slashCommandsData = slashCommands;
    console.log(`Załadowano ${commandsMap.size} komend tekstowych (wraz z aliasami) i ${slashCommands.length} komend slash.`);
}

module.exports = { loadCommands };