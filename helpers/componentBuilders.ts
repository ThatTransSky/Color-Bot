import {
    APIButtonComponent,
    APIStringSelectComponent,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ColorResolvable,
    EmbedBuilder,
    StringSelectMenuBuilder,
} from 'discord.js';
import { LocalUtils } from './utils.js';
import { RoleConfig } from '../classes/roleConfig.js';

export function exitButton(mainAction: string) {
    return new ButtonBuilder({
        custom_id: `${mainAction}|exit`,
        label: 'Exit',
        style: ButtonStyle.Danger,
    });
}

export function backButton(customIdObj: CustomIdObj, previousStage?: string) {
    return new ButtonBuilder({
        label: 'Back',
        style: ButtonStyle.Secondary,
    }).setCustomId(
        LocalUtils.buildCustomId({
            ...customIdObj,
            stage:
                previousStage !== undefined ? previousStage : customIdObj.stage,
        }),
    );
}

export function newButtonRow(mainAction: string, withExit?: boolean) {
    const row = new ActionRowBuilder<ButtonBuilder>();
    withExit ? row.setComponents(exitButton(mainAction)) : row;
    return row;
}

export function newButton(
    options: Partial<APIButtonComponent>,
    customIdObj: CustomIdObj,
) {
    return new ButtonBuilder(options).setCustomId(
        LocalUtils.buildCustomId(customIdObj),
    );
}

export function addButton(
    options: Partial<APIButtonComponent>,
    customIdObj: CustomIdObj,
) {
    return new ButtonBuilder(options).setCustomId(
        LocalUtils.buildCustomId(customIdObj),
    );
}

export function nextPreviousAndCurrentButtons(
    roleConfig: RoleConfig,
    customIdObj: CustomIdObj,
    roleType: string,
) {
    const roleTypes = roleConfig.types;
    const currIndex = roleTypes.findIndex(
        (type) => type.value === roleType.toLowerCase(),
    );
    if (currIndex === -1) {
        LocalUtils.log(
            'error',
            "nextAndPreviousButtons - roleType doesn't exist, got " + roleType,
        );
        return [];
    }
    const nextType =
        currIndex + 1 < roleTypes.length // if curr is not last
            ? roleTypes[currIndex + 1] // Next
            : roleTypes[0]; // First
    const nextButton = new ButtonBuilder({
        label: `Next: ${nextType.label}`,
        style: ButtonStyle.Success,
        customId: LocalUtils.buildCustomId({
            ...customIdObj,
            stage: 'selectRole',
            anythingElse: [nextType.value],
        }),
    });
    const currentType = roleTypes[currIndex];
    const currentButton = new ButtonBuilder({
        label: `Current: ${currentType.label}`,
        style: ButtonStyle.Primary,
        customId: LocalUtils.buildCustomId({
            ...customIdObj,
            stage: 'selectRole',
            anythingElse: [currentType.value],
        }),
    });
    const previousType = roleTypes.at(currIndex - 1);
    const previousButton = new ButtonBuilder({
        label: `Previous: ${previousType.label}`,
        style: ButtonStyle.Secondary,
        customId: LocalUtils.buildCustomId({
            ...customIdObj,
            stage: 'selectRole',
            anythingElse: [previousType.value],
        }),
    });
    return [nextButton, currentButton, previousButton];
}

export function newEmbed(
    title: string,
    description: string,
    timestamp: boolean = true,
    color: ColorResolvable = 'Random',
): EmbedBuilder {
    return timestamp === true
        ? new EmbedBuilder()
              .setTitle(title)
              .setTimestamp()
              .setDescription(description)
              .setColor(color)
        : new EmbedBuilder()
              .setTitle(title)
              .setDescription(description)
              .setColor(color);
}

export function newStringSelectMenuBuilderRow(
    options: Partial<APIStringSelectComponent>,
    customIdObj: CustomIdObj,
) {
    const { anythingElse, mainAction, secondaryAction, stage } = customIdObj;
    return new ActionRowBuilder<StringSelectMenuBuilder>().setComponents([
        new StringSelectMenuBuilder(options).setCustomId(
            `${mainAction}|${secondaryAction}${
                stage
                    ? `|${stage}${
                          anythingElse.length !== 0
                              ? `|${anythingElse.join('|')}`
                              : ''
                      }`
                    : ''
            }`,
        ),
    ]);
}

export interface CustomIdObj {
    mainAction: string;
    secondaryAction: string;
    stage: string;
    anythingElse: string[];
}
