import { stripIndent } from 'common-tags';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentType,
    EmbedBuilder,
    PermissionFlagsBits,
    SlashCommandBuilder,
    italic,
} from 'discord.js';
import { newButtonRow } from '../helpers/componentBuilders.js';
import { LocalUtils } from '../helpers/utils.js';

export const data = new SlashCommandBuilder()
    .setName('spawn-role-messages')
    .setDescription(
        'Creates (or replaces) the messages for the role selections',
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);
export async function execute(interaction: ChatInputCommandInteraction) {
    const { client, channel } = interaction;
    if (
        !['1052167803395911700', '1015749480840167435'].includes(
            interaction.channelId,
        )
    ) {
        return await interaction.reply({
            content: 'This Message can only be spawned in the Roles channel.',
            ephemeral: true,
        });
    } else if (!interaction.memberPermissions.has('ManageRoles')) {
        return await interaction.reply({
            content: 'You lack the permissions to spawn this message.',
            ephemeral: true,
        });
    }
    await interaction.deferReply();
    const rawMessages = await channel.messages.fetch();
    const roleMessages = rawMessages.filter(
        (message) =>
            message.author.id === client.user.id &&
            message.embeds.length !== 0 &&
            message.embeds[0].title === 'Role Menu',
    );
    if (roleMessages.size !== 0) {
        roleMessages.forEach((message) => {
            message.delete();
        });
    }
    const startMessageEmbed = new EmbedBuilder()
        .setColor('LuminousVividPink')
        .setTitle('Role Menu')
        .setDescription(
            stripIndent`
            Press 'Start' whenever you're ready.
            `,
        );
    const startRow = newButtonRow('roles', [
        new ButtonBuilder()
            .setCustomId(
                LocalUtils.buildCustomId({
                    mainAction: 'roles',
                    secondaryAction: 'start',
                    stage: 'startRoleMenu',
                    anythingElse: [],
                }),
            )
            .setLabel('Start')
            .setStyle(ButtonStyle.Primary),
    ]);
    return await interaction.editReply({
        embeds: [startMessageEmbed],
        components: [startRow],
    });
}
