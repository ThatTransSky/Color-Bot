import { readdir } from 'fs';
import { EventStructure } from '../classes/EventStructure.js';
import { ClientWithCommands } from '../main.js';
import { Collection } from 'discord.js';
import { CommandStructure } from '../classes/CommandStructure.js';
import { LocalUtils } from './utils.js';

export async function loadCommands(
    client: ClientWithCommands,
    loaded: () => void,
) {
    getCommandFiles(async (commandFiles) => {
        let commands: CommandStructure[] = [];
        client.commands = new Collection<string, CommandStructure>();
        for (const file of commandFiles) {
            const command = (await import(file)) as CommandStructure;
            commands.push(command);
            client.commands.set(command.data.name, command);
        }
        if (commands.length === 0 || client.commands.at(0) === undefined) {
            LocalUtils.log('warn', 'WARN: No commands were loaded.');
        }
        loaded();
    });
}

export async function loadEvents(
    client: ClientWithCommands,
    loaded: () => void,
) {
    getEventFiles(async (eventFiles) => {
        let events: EventStructure[] = [];
        for (const file of eventFiles) {
            const event = (await import(file)) as EventStructure;
            events.push(event);
            client[event.data.once ? 'once' : 'on'](
                event.data.name,
                (...args) => event.execute(...args, client),
            );
        }

        if (events.length === 0) {
            LocalUtils.log('warn', 'WARN: No events were loaded.');
        }
        loaded();
    });
}

async function getCommandFiles(cb: (files: string[]) => void) {
    readdir(
        'commands',
        { encoding: 'utf-8', recursive: true },
        (err, files) => {
            if (err !== null && err !== undefined) {
                LocalUtils.log('error', err);
                throw err;
            }

            const commandFiles = files.filter((file) => file.endsWith('.ts'));
            if (commandFiles.length === 0) {
                return LocalUtils.log(
                    'error',
                    'ERROR: No commands were found!',
                );
            }
            commandFiles.forEach(
                (file, i) => (commandFiles[i] = '../commands/' + file),
            );

            cb(commandFiles);
        },
    );
}

async function getEventFiles(cb: (files: string[]) => void) {
    readdir('events', { encoding: 'utf-8', recursive: true }, (err, files) => {
        if (err !== null && err !== undefined) {
            LocalUtils.log('error', err);
            throw err;
        }

        const eventFiles = files.filter((file) => file.endsWith('.ts'));
        if (eventFiles.length === 0) {
            return LocalUtils.log('error', 'ERROR: No events were found!');
        }

        eventFiles.forEach((file, i) => (eventFiles[i] = '../events/' + file));

        cb(eventFiles);
        return;
    });
}
