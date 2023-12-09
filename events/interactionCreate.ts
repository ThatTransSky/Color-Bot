import { stripIndent } from 'common-tags';
import { Interaction, userMention } from 'discord.js';
import { exitInteraction } from '../handlers/miscHandlers.js';
import { routeRoleInteraction } from '../handlers/roleMenu.js';
import { Globals } from '../helpers/globals.js';
import { ClientWithCommands } from '../main.js';

export const data = { name: 'interactionCreate' };
export async function execute(
    interaction: Interaction,
    client: ClientWithCommands,
) {
    Globals.logInteractionType(interaction);
    // if (Globals.devMode && Globals.inDevTeam(interaction.user.id)) {
    // if (interaction.user.id !== Globals.CREATOR_ID) {
    //     if (interaction.isRepliable()) {
    //         return interaction.reply({
    //             content: stripIndent`
    //                 The bot is currently in Dev Mode™.
    //                 That usually means that the developer (${userMention(
    //                     Globals.CREATOR_ID,
    //                 )}) is currently working on the bot.
    //                 Feel free to dm her or try again later.
    //                 `,
    //             ephemeral: true,
    //         });
    //     } else return;
    // }
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
        return routeRoleInteraction(interaction, client, customIdObj);
    }
    client.emit(
        'warn',
        `MainAction was not handled or did not return after handling - got ${customIdObj.mainAction}`,
    );
}
