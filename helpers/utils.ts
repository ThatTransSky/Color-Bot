import ch from 'chalk';
import { debugEnabled } from '../main.js';
import { Interaction, TextInputModalData } from 'discord.js';
import { CustomIdObj } from './componentBuilders.js';
import { Route } from '../classes/routes.js';

export class LocalUtils {
    public static jsonParse = <T>(jsonString: string): T => {
        return <T>JSON.parse(jsonString);
    };

    public static jsonString = (jsonObject: any, pretty = false): string => {
        return pretty
            ? JSON.stringify(jsonObject, null, 4)
            : JSON.stringify(jsonObject);
    };

    public static log = (level?: LogLevels, ...items: any[]): void => {
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
    };

    public static interactionTypeToString = (
        interaction: Interaction,
    ): string | undefined => {
        if (interaction.isCommand()) {
            if (interaction.isChatInputCommand()) return 'Chat Command';
            else if (interaction.isContextMenuCommand()) {
                if (interaction.isUserContextMenuCommand())
                    return 'User Context Menu Command';
                else if (interaction.isMessageContextMenuCommand())
                    return 'Message Context Menu Command';
            }
        } else if (interaction.isAnySelectMenu())
            return 'Select Menu Interaction';
        else if (interaction.isButton()) return 'Button Interaction';
        else if (interaction.isModalSubmit()) return 'Modal Submit Interaction';
        else if (interaction.isAutocomplete())
            return 'AutoComplete Interaction';
        else LocalUtils.log('error', `Unknown Interaction, got ${interaction}`);
    };

    public static uppercaseWord = (string: string) => {
        return new String().concat(
            string.charAt(0).toUpperCase(),
            string.substring(1),
        );
    };

    public static buildCustomId = (obj: CustomIdObj) => {
        // mainAction|secondaryAction|stage|anythingElse
        const { anythingElse, mainAction, secondaryAction, stage } = obj;
        return `${mainAction}${
            secondaryAction
                ? `|${secondaryAction}${
                      stage
                          ? `|${stage}${
                                !LocalUtils.isArrayEmpty(anythingElse)
                                    ? `|${anythingElse.join(',')}`
                                    : ''
                            }`
                          : ''
                  }`
                : ''
        }`;
    };

    public static extractCustomId = (customId: string): CustomIdObj => {
        return {
            mainAction: customId.split('|').at(0) ?? undefined,
            secondaryAction: customId.split('|').at(1) ?? undefined,
            stage: customId.split('|').at(2) ?? undefined,
            anythingElse: customId.split('|').at(3)?.split(',') ?? [],
        };
    };

    public static isArrayEmpty = (arr: any[]) => {
        return arr === undefined || arr.length === 0;
    };

    public static inputPredicate(inputName: string) {
        return (input: TextInputModalData) => input.customId === inputName;
    }

    public static findCurrRoute = (
        customIdObj: CustomIdObj,
        routes: Route[],
    ) => {
        let matchingRoutes = routes.filter(
            (route) =>
                // stage is the same
                route.stage === customIdObj.stage &&
                // secondaryAction is the same (or non existent)
                (route.secondaryAction === undefined ||
                    route.secondaryAction === customIdObj.secondaryAction) &&
                // anythingElse is the same (or non existent/empty)
                (LocalUtils.isArrayEmpty(route.anythingElse) ||
                    route.anythingElse.every(
                        (smth, i) => smth === customIdObj.anythingElse[i],
                    )),
        );

        if (matchingRoutes.length <= 0) {
            LocalUtils.log(
                'error',
                `findCurrRoute - ${customIdObj.stage} is missing from the given routes!`,
            );
            return undefined;
        }
        if (matchingRoutes.length > 1) {
            LocalUtils.log(
                'warn',
                `findCurrRoute - ${customIdObj.stage} made more than one match! Returning the first match found... (execute - ${matchingRoutes[0].execute.name})`,
            );
        }
        if (matchingRoutes[0].execute === undefined) {
            LocalUtils.log(
                'error',
                `findCurrRoute - ${customIdObj.stage} found but is missing its execute method!`,
            );
            return undefined;
        }
        return matchingRoutes[0];
    };

    public static invalidCharacters = (
        objToCheck: Object,
        validRegExp: RegExp,
    ) => {
        const result: InvalidCharactersResult = {
            invalid: false,
            props: [],
        };
        const props = Object.getOwnPropertyNames(objToCheck);
        props.forEach((prop) => {
            result.props.push({
                name: prop,
                value: objToCheck[prop],
                invalid: false,
            });
        });
        const filteredProps = props.filter(
            (prop) =>
                objToCheck[prop].match(validRegExp) !== null ||
                objToCheck[prop] === undefined ||
                objToCheck[prop] === '',
        );
        props.forEach((prop) => {
            if (!filteredProps.includes(prop)) {
                result.props[
                    result.props.findIndex((p) => prop === p.name)
                ].invalid = true;
            }
        });
        result.props.forEach((prop) => {
            if (prop.invalid) result.invalid = true;
        });
        return result;
    };
}

type LogLevels = 'error' | 'warn' | 'debug' | 'log';

interface InvalidCharactersResult {
    invalid: boolean;
    props: { name: string; value: string; invalid: boolean }[];
}
