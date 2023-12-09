import { ApplicationCommandData, Collection, REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { ClientWithCommands } from '../main';
import { exit } from 'process';
import { log } from '../helpers/utils.js';
import { Globals } from '../helpers/globals.js';
config(); // required for .env

export const data = {
    name: 'ready',
    once: true,
};

export async function execute(client: ClientWithCommands) {
    let commands = new Collection<string, ApplicationCommandData>();
    client.commands.forEach((command) => {
        commands.set(command.data.name, command.data);
    });

    if (!client || !client.user) {
        client.emit(
            'error',
            new Error(`ClientReady event triggered but client is missing?`),
        );
        exit(1);
    }

    log('log', `Logged in as ${client.user.tag}!`);
    const CLIENT_ID = process.env.CLIENT_ID as string;
    const GUILD_ID = Globals.GUILD_ID as string;
    const rest = new REST({
        version: '10',
    }).setToken(process.env.TOKEN as string);

    if (process.env.ENV.toLowerCase() === 'production') {
        rest.put(Routes.applicationCommands(CLIENT_ID), {
            body: commands,
        });
        console.log('Successfully registered global commands.');
    } else if (process.env.ENV.toLowerCase() === 'development') {
        rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
            body: commands,
        });
        console.log('Successfully registered local commands.');
    } else {
        console.log(
            `Deployment Environment not recognized, got ${
                process.env.ENV as string
            }`,
        );
    }

    Globals.Roles.verifyStoredRoles(client);
    if (Globals.devMode)
        log('warn', 'Dev Mode™ enabled! Limiting access to dev team only...');
}
