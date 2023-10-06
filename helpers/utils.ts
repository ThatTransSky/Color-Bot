import ch from 'chalk';
import { debugEnabled } from '../main.js';
import { Interaction } from 'discord.js';

export function jsonParse<T>(jsonString: string): T {
    return <T>JSON.parse(jsonString);
}

export function jsonString(jsonObject: any, pretty = false): string {
    if (pretty) return JSON.stringify(jsonObject, null, 2);
    else return JSON.stringify(jsonObject);
}

interface LogOptions {
    level?: 'error' | 'warn' | 'debug' | 'log';
}

export function log(options?: LogOptions, ...items: any[]): void {
    const logLevel =
        options?.level !== undefined && options?.level !== null
            ? options.level
            : 'log';
    switch (logLevel) {
        case 'error':
            console.log(ch.redBright(items.join('')));
            break;
        case 'debug':
            if (debugEnabled)
                console.log(ch.whiteBright(ch.bgGray(items.join(''))));
            break;
        case 'warn':
            console.log(ch.yellowBright(items.join('')));
            break;
        case 'log':
            console.log(items.join(''));
            break;
    }
}

export function interactionTypeToString(
    interaction: Interaction,
): string | undefined {
    if (interaction.isCommand()) {
        if (interaction.isChatInputCommand()) return 'Chat Command';
        else if (interaction.isContextMenuCommand()) {
            if (interaction.isUserContextMenuCommand())
                return 'User Context Menu Command';
            else if (interaction.isMessageContextMenuCommand())
                return 'Message Context Menu Command';
        }
    } else if (interaction.isAnySelectMenu()) return 'Select Menu Interaction';
    else if (interaction.isButton()) return 'Button Interaction';
    else if (interaction.isModalSubmit()) return 'Modal Submit Interaction';
    else if (interaction.isAutocomplete()) return 'AutoComplete Interaction';
    else log({ level: 'error' }, `Unknown Interaction, got ${interaction}`);
}

export function uppercaseWord(string: string) {
    return new String().concat(
        string.charAt(0).toUpperCase(),
        string.substring(1),
    );
}
