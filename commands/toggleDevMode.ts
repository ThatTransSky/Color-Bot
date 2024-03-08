import {
    ChatInputCommandInteraction,
    SlashCommandBooleanOption,
    SlashCommandBuilder,
    inlineCode,
} from 'discord.js';
import { Globals } from '../helpers/globals.js';
import { LocalUtils } from '../helpers/utils.js';
import { stripIndent } from 'common-tags';

export const data = new SlashCommandBuilder()
    .setName('toggle-dev-mode')
    .setDescription('Dev - Toggles the Dev Mode™ state of the bot.')
    .addBooleanOption(
        new SlashCommandBooleanOption()
            .setName('state')
            .setDescription('What should the state be?')
            .setRequired(false),
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;
    if (
        !Globals.globalBotConfig.checkBypassList(userId) &&
        userId !== Globals.CREATOR_ID
    ) {
        return await interaction.reply({
            content: `This command is reserved for the dev team of the bot.`,
            ephemeral: true,
        });
    }

    await interaction.deferReply({ ephemeral: true });
    let state = interaction.options.getBoolean('state', false);

    if (state === undefined) {
        state = !Globals.globalBotConfig.devMode;
    }

    if (state === Globals.globalBotConfig.devMode) {
        return await interaction.editReply({
            content: `The Dev Mode™ is already set to ${inlineCode(
                `${state}`,
            )}.`,
        });
    }

    Globals.globalBotConfig.toggleDevMode();
    if (Globals.globalBotConfig.devMode === true) {
        LocalUtils.log(
            'warn',
            stripIndent`
            Dev Mode™ toggled on by ${interaction.user.displayName} (id: ${interaction.user.id})!
            Limiting access to the following users:`,
        );
        Globals.globalBotConfig.outputBypassList(interaction.client);
    } else {
        LocalUtils.log(
            'warn',
            `Dev Mode™ toggled off by ${interaction.user.displayName} (id: ${interaction.user.id})!`,
        );
    }
    return await interaction.editReply({
        content: `Dev Mode™ successfully set to ${inlineCode(
            `${Globals.globalBotConfig.devMode}`,
        )}!`,
    });
}
