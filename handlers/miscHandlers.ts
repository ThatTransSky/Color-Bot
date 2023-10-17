import {
    AnySelectMenuInteraction,
    ButtonInteraction,
    ModalSubmitInteraction,
} from 'discord.js';

export async function exitInteraction(
    interaction:
        | ButtonInteraction
        | AnySelectMenuInteraction
        | ModalSubmitInteraction,
) {
    await interaction.deferUpdate();
    return await interaction.deleteReply();
}
