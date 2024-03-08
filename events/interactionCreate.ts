import { stripIndent } from 'common-tags';
import { Interaction, userMention } from 'discord.js';
import { exitInteraction } from '../handlers/miscHandlers.js';
import { routeRoleInteraction } from '../handlers/roleMenu.js';
import { Globals } from '../helpers/globals.js';
import { ClientWithCommands } from '../main.js';
import { LocalUtils } from '../helpers/utils.js';
import { routeTempDataInteractions } from '../handlers/routeTempData.js';

export const data = { name: 'interactionCreate' };
export async function execute(
    interaction: Interaction,
    client: ClientWithCommands,
) {
    Globals.logInteractionType(interaction);
    if (
        Globals.globalBotConfig.devMode &&
        interaction.user.id !== Globals.CREATOR_ID &&
        !Globals.globalBotConfig.checkBypassList(interaction.user.id) &&
        !interaction['customId']?.includes('exit')
    ) {
        if (interaction.isRepliable()) {
            return interaction.reply({
                content: stripIndent`
                    The bot is currently in Dev Mode™.
                    That usually means that the developer (${userMention(
                        Globals.CREATOR_ID,
                    )}) (or someone from the team) is currently working on the bot.
                    Feel free to dm them or try again later.
                    `,
                ephemeral: true,
            });
        } else return;
    }
    if (interaction.isCommand()) {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (command === undefined) {
                client.emit(
                    'warn',
                    `Attempted command doesn't exist, got ${command}`,
                );
                return;
            }
            LocalUtils.log(
                'debug',
                `Command Name - ${interaction.commandName}`,
            );
            return await command.execute(interaction, client);
        } else if (interaction.isContextMenuCommand()) {
            return;
        }
    } else if (interaction.isAutocomplete()) {
        return;
    }

    const customIdObj = LocalUtils.extractCustomId(interaction.customId);
    if (customIdObj.secondaryAction.toLowerCase() === 'exit') {
        return exitInteraction(interaction);
    }
    if (customIdObj.mainAction === 'roles') {
        return routeRoleInteraction(interaction, client, customIdObj);
    }
    if (customIdObj.mainAction === 'tempData') {
        return routeTempDataInteractions(interaction, client, customIdObj);
    }
    client.emit(
        'warn',
        `MainAction was not handled or did not return after handling - got ${customIdObj.mainAction}`,
    );
}
