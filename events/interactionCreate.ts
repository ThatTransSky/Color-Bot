import { stripIndent } from 'common-tags';
import { Interaction } from 'discord.js';
import { ClientWithCommands } from '../main.js';
import { interactionTypeToString, log } from '../helpers/utils.js';
import { mainRoleMenu } from '../handlers/roleMenu.js';
import { Constants } from '../helpers/constants.js';
import { exitInteraction } from '../handlers/miscHandlers.js';

export const data = { name: 'interactionCreate' };
export async function execute(
    interaction: Interaction,
    client: ClientWithCommands,
) {
    log(
        { level: 'debug' },
        stripIndent`
			Interaction received:
			Type - ${interactionTypeToString(interaction)}
			`,
    );
    if (interaction.user.id !== Constants.CREATOR_ID) {
        if (interaction.isRepliable()) {
            return interaction.reply({
                content: stripIndent`
                    The bot is currently open for the creator only.
                    An announcement will be made when the bot will be open for others.`,
                ephemeral: true,
            });
        }
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

            return await command.execute(interaction);
        } else if (interaction.isContextMenuCommand()) {
            return;
        }
    } else if (interaction.isAutocomplete()) {
        return;
    }
    const { customId } = interaction;

    const customIdObj = {
        mainAction: customId.split('|').at(0) ?? undefined,
        secondaryAction: customId.split('|').at(1) ?? undefined,
        stage: customId.split('|').at(2) ?? undefined,
        anythingElse: customId.split('|').slice(3) ?? [],
    };
    if (customIdObj.secondaryAction.toLowerCase() === 'exit') {
        return exitInteraction(interaction);
    }

    if (customIdObj.mainAction === 'roles') {
        return mainRoleMenu(interaction, client, customIdObj);
    }
    client.emit(
        'warn',
        `MainAction was not handled or did not return after handling - got ${customIdObj.mainAction}`,
    );
}
