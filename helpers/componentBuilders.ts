import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ColorResolvable,
    EmbedBuilder,
    StringSelectMenuBuilder,
} from 'discord.js';

export function newButtonRow(mainAction: string) {
    return new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
            .setCustomId(`${mainAction}|exit`)
            .setLabel('Exit')
            .setStyle(ButtonStyle.Danger),
    ]);
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
    mainAction: string,
    secondaryAction: string,
    stage?: string,
    anythingElse?: string,
) {
    return new ActionRowBuilder<StringSelectMenuBuilder>().setComponents([
        new StringSelectMenuBuilder().setCustomId(
            `${mainAction}|${secondaryAction}${
                stage
                    ? `|${stage}${anythingElse ? `|${anythingElse}` : ''}`
                    : ''
            }`,
        ),
    ]);
}
