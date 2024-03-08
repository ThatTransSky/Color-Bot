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
    if (!client || !client.user) {
        client.emit(
            'error',
            new Error(`ClientReady event triggered but client is missing?`),
        );
        exit(1);
    }
    let commands = new Collection<
        string,
        ApplicationCommandData & { description?: string }
    >();
    client.commands.forEach((command) => {
        commands.set(command.data.name, command.data);
    });

    LocalUtils.log('success', `Logged in as ${client.user.tag}!`);
    const CLIENT_ID = process.env.CLIENT_ID as string;
    const MAIN_GUILD_ID = Globals.MAIN_GUILD_ID;
    const DEV_GUILD_ID = Globals.DEV_GUILD_ID;
    const rest = new REST({
        version: '10',
    }).setToken(process.env.TOKEN as string);
    const devCommands = commands.filter((command) =>
        command.description?.startsWith('Dev - '),
    );
    const regularCommands = commands.filter(
        (command) => !command.description?.startsWith('Dev - '),
    );
    if (devCommands.toJSON().length !== 0) {
        LocalUtils.log(
            'warn',
            'Dev commands detected, checking DEV_GUILD_ID...',
        );
        const devGuild = client.guilds.cache.get(DEV_GUILD_ID);
        if (devGuild === undefined) {
            LocalUtils.log(
                'error',
                `DEV_GUILD_ID is invalid, got ${DEV_GUILD_ID}.\nDev Commands are disabled for this instance.`,
            );
        }
        LocalUtils.log(
            'warn',
            `DEV_GUILD_ID is valid, directing dev commands to guild '${devGuild.name}' (${DEV_GUILD_ID}).`,
        );
    }
    if (process.env.ENV.toLowerCase() === 'production') {
        rest.put(Routes.applicationCommands(CLIENT_ID), {
            body: regularCommands,
        });
        LocalUtils.log('log', 'Successfully registered global commands.');
    } else if (process.env.ENV.toLowerCase() === 'development') {
        client.guilds.cache.forEach((guild, guildId) => {
            if (guildId === DEV_GUILD_ID) {
                rest.put(Routes.applicationGuildCommands(CLIENT_ID, guildId), {
                    body: devCommands.concat(regularCommands),
                });
                LocalUtils.log(
                    'success',
                    `Registered commands (including dev) in ${guildId} (${guild.name}). `,
                );
                return;
            }
            rest.put(Routes.applicationGuildCommands(CLIENT_ID, guildId), {
                body: regularCommands,
            });
            LocalUtils.log(
                'success',
                `Registered commands in ${guildId} (${guild.name}).`,
            );
        });
        LocalUtils.log(
            'success',
            'Successfully registered per guild commands.',
        );
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
