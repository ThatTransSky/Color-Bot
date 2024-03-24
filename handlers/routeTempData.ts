import { ButtonInteraction, Client, Interaction, italic } from 'discord.js';
import { CustomIdObj, newEmbed } from '../helpers/componentBuilders.js';
import { Route } from '../classes/routes.js';
import { LocalUtils } from '../helpers/utils.js';
import { Globals } from '../helpers/globals.js';
import { stripIndent } from 'common-tags';
import { getIdentifiers } from '../helpers/discordHelpers.js';

export async function routeTempDataInteractions(
    interaction: Interaction,
    client: Client,
    customIdObj: CustomIdObj,
) {
    const routes: Route[] = [
        {
            secondaryAction: 'clearData',
            stage: 'actionConfirmed',
            execute: clearTempDataStage,
        },
        {
            secondaryAction: 'clearData',
            stage: 'nevermind',
            execute: bombHasBeenDefused,
        },
    ];
    if (interaction.isCommand() || interaction.isAutocomplete()) return;
    await interaction.deferUpdate();
    const currRoute = LocalUtils.findCurrRoute(customIdObj, routes);
    if (currRoute === undefined) return;
    currRoute.execute(interaction, client, customIdObj);
}

async function clearTempDataStage(
    interaction: ButtonInteraction,
    client: Client,
    customIdObj: CustomIdObj,
) {
    Globals.tempData.clearData();
    if (Globals.tempData.countTotalData() !== 0) {
        return await interaction.editReply({
            content:
                'There was an error clearing data. Please try again later.',
            embeds: [],
            components: [],
        });
    }

    const successEmbed = newEmbed(
        'Cleared Data',
        stripIndent`
        Success!

        Cleared the bot's cache successfully.
        `,
    );

    await interaction.editReply({
        content: '',
        embeds: [successEmbed],
        components: [],
    });

    setTimeout(() => interaction.deleteReply(), 5000);
}

async function bombHasBeenDefused(
    interaction: ButtonInteraction,
    client: Client,
    customIdObj: CustomIdObj,
) {
    const embed = newEmbed(
        'Phew',
        `"${italic('Bomb has been defused. Counter-Terroists Wins.')}"`,
    );
    await interaction.editReply({
        content: '',
        embeds: [embed],
        components: [],
    });

    setTimeout(() => interaction.deleteReply(), 3000);
}
