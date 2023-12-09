import ch from 'chalk';
import { debugEnabled } from '../main.js';
import { Interaction } from 'discord.js';
import { CustomIdObj } from './componentBuilders.js';

export function jsonParse<T>(jsonString: string): T {
    return <T>JSON.parse(jsonString);
}

export function jsonString(jsonObject: any, pretty = false): string {
    return pretty
        ? JSON.stringify(jsonObject, null, 4)
        : JSON.stringify(jsonObject);
}

type LogLevels = 'error' | 'warn' | 'debug' | 'log';

export function log(level?: LogLevels, ...items: any[]): void {
    const logLevel = level !== undefined && level !== null ? level : 'log';
    switch (logLevel) {
        case 'error':
            console.log(ch.redBright(items.join('')));
            break;
        case 'debug':
            debugEnabled
                ? console.log(ch.whiteBright(ch.bgGray(items.join(''))))
                : '';
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
    else log('error', `Unknown Interaction, got ${interaction}`);
}

export function uppercaseWord(string: string) {
    return new String().concat(
        string.charAt(0).toUpperCase(),
        string.substring(1),
    );
}

export function buildCustomId(obj: CustomIdObj) {
    // mainAction|secondaryAction|stage|anythingElse
    const { anythingElse, mainAction, secondaryAction, stage } = obj;
    return `${mainAction}${
        secondaryAction
            ? `|${secondaryAction}${
                  stage
                      ? `|${stage}${
                            anythingElse.length !== 0
                                ? `|${anythingElse.join('|')}`
                                : ''
                        }`
                      : ''
              }`
            : ''
    }`;
}
