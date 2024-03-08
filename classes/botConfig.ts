import { readFileSync, writeFile } from 'fs';
import { LocalUtils } from '../helpers/utils.js';
import { Globals } from '../helpers/globals.js';
import { ClientWithCommands } from '../main.js';
import { Client } from 'discord.js';

interface bannedPhrase {
    phrase: string;
    severity: 'low' | 'medium' | 'high';
    immediateAction: 'delete' | 'mute' | 'kick';
    authorizedPunishment?: 'mute' | 'kick' | 'tempBan' | 'permBan';
    tempLengthInSeconds?: number;
    automatedReason?: string;
}

export class BotConfig {
    public guildId = '';
    public bannedPhrases: bannedPhrase[] = [];

    // Internal Props
    private makePath = <Content extends string>(
        guildId: Content,
    ): `localData/${Content}/bot_config.json` =>
        `localData/${guildId}/bot_config.json`;
    private updateQueue: string[] = [];
    // End Internal Props

    constructor(guildId: string) {
        this.guildId = guildId;
        try {
            const file = readFileSync(this.makePath(guildId), {
                encoding: 'utf8',
            });
            const data = <BotConfig>LocalUtils.jsonParse(file);
            this.bannedPhrases = !LocalUtils.isArrayEmpty(data.bannedPhrases)
                ? data.bannedPhrases
                : [];
            this.validateData();
            this.updateFile();
        } catch (err) {
            this.bannedPhrases = [];
            this.updateQueue.push('boo');
        }
        LocalUtils.log('success', `botConfig - ${guildId}: Config ready.`);
    }

    private validateData() {
        /**
         * This function should do two things:
         ** 1. DONE - Go through devModeBypassList and output all users that are in the bypass list.
         * 2. Validate the data structure of bannedPhrases
         */
        this.queueUpdate();
        return true;
    }

    private queueUpdate() {
        //* Again, doesn't matter what we push.
        this.updateQueue.push('beep');
    }

    private updateFile() {
        setInterval(() => {
            if (this.updateQueue.shift() === undefined) return;
            const object = this.objectify();
            writeFile(
                this.makePath(this.guildId),
                LocalUtils.jsonString(object, true),
                {
                    encoding: 'utf-8',
                },
                Globals.ifErrThrowCb,
            );
        }, 5000);
    }

    private objectify() {
        return {
            bannedPhrases: this.bannedPhrases,
        };
    }
}
