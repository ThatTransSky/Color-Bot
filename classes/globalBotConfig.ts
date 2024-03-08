import { Client, User } from 'discord.js';
import { readFileSync, writeFile } from 'fs';
import { Globals } from '../helpers/globals.js';
import { LocalUtils } from '../helpers/utils.js';
import { ClientWithCommands } from '../main.js';

export class GlobalBotConfig {
    public devMode = false;
    public devModeBypassIdList: string[] = [];
    private devModeIdBlacklist: string[] = [];
    private updateQueue: string[] = [];
    private configPath = `localData/bot_config.json`;

    constructor() {
        const file = readFileSync(this.configPath, {
            encoding: 'utf8',
        });
        const data = <GlobalBotConfig>LocalUtils.jsonParse(file);
        this.devMode = data.devMode !== undefined ? data.devMode : false;
        this.devModeBypassIdList = !LocalUtils.isArrayEmpty(
            data.devModeBypassIdList,
        )
            ? data.devModeBypassIdList
            : [];
        this.validateData();
        this.updateFile();
    }

    public toggleDevMode() {
        this.devMode = !this.devMode;
        this.queueUpdate();
    }

    public checkBypassList(userId: string) {
        return this.devModeBypassIdList.findIndex((id) => userId === id) !== -1;
    }

    public async outputBypassList(client: Client | ClientWithCommands) {
        const bypassIds = this.devModeBypassIdList;
        const clientGuilds = client.guilds.cache;
        let found = false;
        let mainGuildId = '';
        let creatorUser: User;
        let index = 0;
        while (clientGuilds.toJSON().length > index) {
            if (found) break;
            const guildMembers = clientGuilds.at(index).members;
            const user = (await guildMembers.fetch()).get(
                Globals.CREATOR_ID,
            )?.user;
            if (user === undefined) continue;
            creatorUser = user;
            found = true;
            index++;
        }
        LocalUtils.log(
            'warn',
            `displayName: ${creatorUser.displayName}, userName: ${creatorUser.username}, id: ${creatorUser.id}`,
        );
        if (bypassIds.length === 0) return;
        let id = bypassIds.shift();
        while (id !== undefined) {
            let user: User;
            clientGuilds.forEach((guild) => {
                user = guild.members.cache.get(id)?.user;
                if (user !== undefined) {
                    LocalUtils.log(
                        'warn',
                        `displayName: ${user.displayName}, userName: ${user.username}, id: ${id}`,
                    );
                }
            });
            if (user === undefined) {
                LocalUtils.log(
                    'warn',
                    `displayName: unknown, userName: unknown, id: ${id}`,
                );
            }
            id = bypassIds.shift();
        }
    }

    public isOnBlacklist(userId: string) {
        return this.devModeIdBlacklist.findIndex((id) => id === userId) !== -1;
    }

    public async bypassListToString(
        client: Client | ClientWithCommands,
        cb: (bypassList: string) => void,
    ) {
        const bypassStrArr: string[] = [];
        const clientGuilds = client.guilds.cache;
        let found = false;
        let guildId: string;
        clientGuilds.forEach((guild, id) => {
            if (found) return;
            if (guild.members.cache.has(Globals.CREATOR_ID)) {
                guildId = id;
                found = true;
            }
        });
        // const addDetailsToArr = ()
    }

    private validateData() {
        /**
         * Does nothing atm.
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
                this.configPath,
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
            devMode: this.devMode,
            devModeBypassList: this.devModeBypassIdList,
            devModeIdBlacklist: this.devModeIdBlacklist,
        };
    }
}
