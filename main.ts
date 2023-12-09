import {
    ActivityType,
    Client,
    Collection,
    GatewayIntentBits,
} from 'discord.js'; // Discord Imports
import { config } from 'dotenv'; // DotEnv Imports
import { CommandStructure } from './classes/CommandStructure.js'; // Purely for TS
import { loadCommands, loadEvents } from './helpers/loaders.js'; // Command and Event Loaders
import { log } from './helpers/utils.js'; // Awesome log function 😎
import { createInterface } from 'readline';
import { stdin, stdout } from 'process';
export type ClientWithCommands = Client & {
    commands: Collection<string, CommandStructure>;
};
export async function main(callback?: (client: ClientWithCommands) => void) {
    let client = new Client({
        presence: {
            status: 'online',
            activities: [
                { type: ActivityType.Watching, name: 'you in your sleep 👻' },
            ],
        },
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            // GatewayIntentBits.MessageContent,
            // GatewayIntentBits.GuildMessageReactions,
            // GatewayIntentBits.GuildPresences
            // GatewayIntentBits.GuildModeration,
            GatewayIntentBits.GuildMembers,
        ],
    });
    const client2 = client as ClientWithCommands;
    log(undefined, 'Loading client commands and events...');
    loadCommands(client2, () => {
        loadEvents(client2, () => {
            client2.login(process.env.TOKEN);
            if (callback !== undefined) callback(client2);
        });
    });
}

export let debugEnabled = false;
async function beforeStart(mainFunc: (...args: any[]) => any, ...args: any[]) {
    const envPath = './localData/.env';
    config({ path: envPath });
    if (process.env.ENV.toLowerCase() === 'production') {
        mainFunc(args);
        return;
    }
    const ac = new AbortController();
    const signal = ac.signal;
    const rl = createInterface({
        input: stdin,
        output: stdout,
    });
    const abortCallback = () => {
        log(undefined, '\nTimed out, defaulting to disabled.');
        rl.close();
        mainFunc(...args);
    };
    signal.addEventListener('abort', abortCallback);
    rl.question(
        'Would you like to enable Debug for this run? (y/n) ',
        { signal: signal },
        (answer) => {
            if (answer.toLowerCase() === 'y') {
                debugEnabled = true;
            }
            rl.close();
            signal.removeEventListener('abort', abortCallback);
            mainFunc(...args);
        },
    );
    setTimeout(() => {
        ac.abort();
    }, 10000);
}

/**
 ** The functions below control to purpose of running `npm start`
 ** beforeStart(main): Regular start, loads the bot
 ** testTime(...args): Test start, used to test something without starting the bot.
 **                    (usually to test a class)
 */
beforeStart(main);
// testTime();
