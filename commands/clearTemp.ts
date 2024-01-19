import {
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    Client,
    SlashCommandBuilder,
    bold,
    inlineCode,
    italic,
} from 'discord.js';
import { Globals } from '../helpers/globals.js';
import {
    CustomIdObj,
    newButtonRow,
    newEmbed,
} from '../helpers/componentBuilders.js';
import { stripIndent } from 'common-tags';
import { LocalUtils } from '../helpers/utils.js';

export const data = new SlashCommandBuilder()
    .setName('clear-temp')
    .setDescription("Clears the bot's cache.");

export async function execute(
    interaction: ChatInputCommandInteraction,
    client: Client,
) {
    await interaction.deferReply({ ephemeral: true });
    if (
        !Globals.globalBotConfig.checkBypassList(interaction.user.id) &&
        interaction.user.id !== Globals.CREATOR_ID
    ) {
        return await interaction.editReply({
            content: 'You do not have permission to execute this command.',
        });
    }
    if (Globals.tempData.countTotalData() === 0) {
        return await interaction.editReply({
            content: "The bot's cache is already empty.",
        });
    }
    const areYouSureEmbed = newEmbed(
        'Confirm Action',
        stripIndent`
        The bot's cache has data for ${inlineCode(
            `${Globals.tempData.countTotalData()}`,
        )} interactions.

        Clearing the cache would invalidate ${bold('all of them')}.
        ${italic('Are you sure you want to proceed? (Not revertable!)')}
        `,
    );
    const customIdObj: CustomIdObj = {
        mainAction: 'tempData',
        secondaryAction: 'clearData',
        stage: undefined,
        anythingElse: [],
    };
    const buttonRow = newButtonRow('tempData').setComponents([
        new ButtonBuilder()
            .setCustomId(
                LocalUtils.buildCustomId({
                    ...customIdObj,
                    stage: 'actionConfirmed',
                }),
            )
            .setLabel('Delete it all!')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId(
                LocalUtils.buildCustomId({
                    ...customIdObj,
                    stage: 'nevermind',
                }),
            )
            .setLabel('No, Get me out!')
            .setStyle(ButtonStyle.Success),
    ]);
    return await interaction.editReply({
        content: '',
        embeds: [areYouSureEmbed],
        components: [buttonRow],
    });
}
