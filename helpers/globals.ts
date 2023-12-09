import { stripIndents } from 'common-tags';
import {
    interactionTypeToString,
    jsonParse,
    jsonString,
    log,
} from './utils.js';
import { Interaction } from 'discord.js';
import { TempData } from '../classes/tempData.js';
import { RoleConstants } from '../classes/RoleConstants.js';
import { readFileSync, writeFileSync } from 'fs';

export class Globals {
    public static GUILD_ID = '1015742449471201320';
    public static CREATOR_ID = '232936279384260609';
    public static ifErrThrowCb = (err: any) => {
        if (err) throw err;
    };
    public static logInteractionType = (interaction: Interaction) =>
        log(
            'debug',
            stripIndents`
        Interaction received:
        Type - ${interactionTypeToString(interaction)}
        ${
            interaction['customId'] !== undefined
                ? `CustomId - ${interaction['customId']}`
                : `${
                      interaction.isAnySelectMenu()
                          ? `Values - ${interaction.values.join(', ')}`
                          : ''
                  }`
        }
        `,
        );
    public static eitherButNotBothUndefined = (arg1: any, arg2: any) =>
        (arg1 === undefined && arg2 !== undefined) ||
        (arg1 !== undefined && arg2 === undefined);
    public static Roles = new RoleConstants();
    public static tempData = new TempData();
    // public static devMode = false;
    // private static devTeamMemberIds: string[] = [];
    // private static readonly botConfigPath = './localData/bot_config.json';
    // private static checkDevMode = () => {
    //     try {
    //         const file = readFileSync(this.botConfigPath, {
    //             encoding: 'utf-8',
    //         });
    //         const config = jsonParse<any>(file);
    //         if (config.devMode) this.devMode = true;
    //         else this.devMode = false;
    //     } catch (err) {
    //         this.devMode = false;
    //     }
    // };
    // public static updateDevMode = (devMode?: boolean) => {
    //     if (devMode !== undefined) this.devMode = devMode;
    //     writeFileSync(
    //         this.botConfigPath,
    //         jsonString({ devMode: this.devMode }, true),
    //         { encoding: 'utf-8' },
    //     );
    //     this.checkDevMode();
    // };
    // public static inDevTeam(userId: string) {
    //     return (
    //         userId === this.CREATOR_ID || this.devTeamMemberIds.includes(userId)
    //     );
    // }

    // //! Make sure this one is always last
    // public static initializeGlobals() {
    //     this.checkDevMode(); // Dev Mode
    // }
}
