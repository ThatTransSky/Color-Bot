import { ApplicationCommandData, Collection, REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { ClientWithCommands } from '../main.js';
import { exit } from 'process';
import { LocalUtils } from '../helpers/utils.js';
import { Globals } from '../helpers/globals.js';
import { GuildConfigs } from '../classes/guildConfigs.js';
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

    LocalUtils.log('log', `Logged in as ${client.user.tag}!`);
    const CLIENT_ID = process.env.CLIENT_ID as string;
    const GUILD_ID = Globals.GUILD_ID as string;
    const rest = new REST({
        version: '10',
    }).setToken(process.env.TOKEN as string);

    if (process.env.ENV.toLowerCase() === 'production') {
        rest.put(Routes.applicationCommands(CLIENT_ID), {
            body: commands,
        });
        LocalUtils.log('log', 'Successfully registered global commands.');
    } else if (process.env.ENV.toLowerCase() === 'development') {
        rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
            body: commands,
        });
        LocalUtils.log('log', 'Successfully registered local commands.');
    } else {
        LocalUtils.log(
            'log',
            `Deployment Environment not recognized, got ${
                process.env.ENV as string
            }`,
        );
    }
    Globals.guildConfigs = new GuildConfigs(client);
    Globals.guildConfigs.guilds.forEach((config) =>
        config.roleConfig.verifyStoredRoles(client),
    );
    if (Globals.globalBotConfig.devMode) {
        LocalUtils.log(
            'warn',
            'Dev Mode™ enabled! Limiting access to the following users: ',
        );
        Globals.globalBotConfig.outputBypassList(client);
    }
}
