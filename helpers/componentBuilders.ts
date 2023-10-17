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
import { buildCustomId } from './utils.js';

export function exitButton(mainAction: string) {
    return new ButtonBuilder({
        custom_id: `${mainAction}|exit`,
        label: 'Exit',
        style: ButtonStyle.Danger,
    });
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
    return new ButtonBuilder(options).setCustomId(buildCustomId(customIdObj));
}

export function addButton(
    thisRow: ActionRowBuilder<ButtonBuilder>,
    options: Partial<APIButtonComponent>,
    customIdObj: CustomIdObj,
) {
    return thisRow.setComponents(
        new ButtonBuilder(options).setCustomId(buildCustomId(customIdObj)),
        ...thisRow.components,
    );
}

export function newEmbed(
    title: string,
    description: string,
    timestamp?: boolean,
    color?: ColorResolvable,
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
