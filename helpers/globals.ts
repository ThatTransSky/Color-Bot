import { stripIndents } from 'common-tags';
import { LocalUtils } from './utils.js';
import { Interaction } from 'discord.js';
import { TempData } from '../classes/tempData.js';
import { GuildConfigs } from '../classes/guildConfigs.js';
import { GlobalBotConfig } from '../classes/globalBotConfig.js';

export class Globals {
    public static MAIN_GUILD_ID = process.env.MAIN_GUILD_ID ?? undefined;
    public static CREATOR_ID = process.env.CREATOR_ID;
    public static DEV_GUILD_ID = process.env.DEV_GUILD_ID ?? undefined;
    public static ifErrThrowCb = (err: any) => {
        if (err) throw err;
    };
    public static logInteractionType = (interaction: Interaction) =>
        LocalUtils.log(
            'debug',
            stripIndents`
        --------------------------------------------------------------------
        Interaction received:
        Created by - ${interaction.user.id} (${interaction.user.username})
        In Guild? - ${interaction.guildId} (${interaction.guild?.name})
        Type - ${LocalUtils.interactionTypeToString(interaction)}
        ${
            interaction['customId'] !== undefined
                ? `CustomId - ${interaction['customId']}`
                : ''
        }
        ${
            interaction.isAnySelectMenu()
                ? `Values - ${interaction.values.join(', ')}`
                : ''
        }
        `,
        );
    public static eitherButNotBothUndefined = (arg1: any, arg2: any) =>
        (arg1 === undefined && arg2 !== undefined) ||
        (arg1 !== undefined && arg2 === undefined);
    public static guildConfigs = new GuildConfigs();
    public static tempData = new TempData();
    public static globalBotConfig = new GlobalBotConfig();
}
