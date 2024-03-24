import { mkdirSync } from 'fs';
import { RoleConfig } from './roleConfig.js';
import { BotConfig } from './botConfig.js';
import { Client, Collection } from 'discord.js';
import { LocalUtils } from '../helpers/utils.js';
import { stripIndent } from 'common-tags';

export class GuildConfigs {
    public guilds: Collection<string, GuildConfig> = new Collection<
        string,
        GuildConfig
    >();

    private makePath = (guildId: string): `localData/${string}/` =>
        `localData/${guildId}/`;

    constructor(client?: Client) {
        if (client === undefined) {
            LocalUtils.log(
                'warn',
                stripIndent`
                GuildConfigs called without a client. Ignore if this showed during startup (before 'ready')
                `,
            );
            return;
        }
        client.guilds.cache.forEach((guild, guildId) => {
            try {
                mkdirSync(this.makePath(guildId));
            } catch (err) {}
            this.guilds.set(guildId, {
                botConfig: new BotConfig(guildId),
                roleConfig: new RoleConfig(guildId),
            });
            LocalUtils.log(
                'success',
                `Config for ${guildId} (${guild.name}) successfully loaded.`,
            );
        });
    }

    public getGuildConfig = (guildId: string) => this.guilds.get(guildId);

    public getRoleConfig = (guildId: string) =>
        this.guilds.get(guildId)?.roleConfig;

    public getBotConfig = (guildId: string) =>
        this.guilds.get(guildId)?.botConfig;
}

interface GuildConfig {
    botConfig?: BotConfig;
    roleConfig?: RoleConfig;
}
