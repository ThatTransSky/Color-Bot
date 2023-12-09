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
} from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('spawn-role-messages')
    .setDescription(
        'Creates (or replaces) the messages for the role selections',
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);
export async function execute(interaction: ChatInputCommandInteraction) {
    try {
        const { client, channel } = interaction;
        if (
            !['1052167803395911700', '1015749480840167435'].includes(
                interaction.channelId,
            )
        ) {
            return await interaction.reply({
                content:
                    'This Message can only be spawned in the Roles channel.',
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
                message.embeds[0].title === 'User Roles',
        );
        if (roleMessages.size !== 0) {
            const startMessageEmbed = EmbedBuilder.from(
                roleMessages.first().embeds[0],
            );
            const rawEditRolesButton = roleMessages
                .first()
                .components[0].components.filter(
                    (component) => component.type === ComponentType.Button,
                )[0];
            if (rawEditRolesButton.type !== ComponentType.Button) return;
            const editRolesButton =
                new ActionRowBuilder<ButtonBuilder>().addComponents([
                    new ButtonBuilder(rawEditRolesButton.data),
                ]);

            roleMessages.forEach(async (message) => await message.delete());
            return await interaction.editReply({
                embeds: [startMessageEmbed],
                components: [editRolesButton],
            });
        } else {
            const startMessageEmbed = new EmbedBuilder()
                .setColor('LuminousVividPink')
                .setTitle('User Roles')
                .setDescription(
                    stripIndent`To choose your roles, click 'Choose Roles'.`,
                );
            const editRolesButton =
                new ActionRowBuilder<ButtonBuilder>().addComponents([
                    new ButtonBuilder()
                        .setCustomId(`roles|userRoles|startMessage`)
                        .setLabel('Choose Roles')
                        .setStyle(ButtonStyle.Primary),
                ]);
            return await interaction.editReply({
                embeds: [startMessageEmbed],
                components: [editRolesButton],
            });
        }
    } catch (err) {
        console.error(err);
    }
}
