import { stripIndent } from 'common-tags';
import {
    AnySelectMenuInteraction,
    ButtonInteraction,
    ButtonStyle,
    Client,
    Interaction,
    userMention,
} from 'discord.js';
import {
    CustomIdObj,
    addButton,
    newButtonRow,
    newEmbed,
    newStringSelectMenuBuilderRow,
} from '../helpers/componentBuilders.js';
import { Constants } from '../helpers/constants.js';

export async function mainRoleMenu(
    interaction: Interaction,
    client: Client,
    customIdObj: CustomIdObj,
) {
    if (
        interaction.isCommand() ||
        interaction.isAutocomplete() ||
        interaction.isModalSubmit()
    ) {
        return;
    }
    const { mainAction, secondaryAction, stage, anythingElse } = customIdObj;
    if (stage === 'startMessage' && !anythingElse.includes('back')) {
        await interaction.deferReply({ ephemeral: true });
    } else await interaction.deferUpdate();
    let buttonRow = newButtonRow(mainAction, true);
    if (secondaryAction !== 'userRoles') return manageRolesMenu();
    if (stage !== 'startMessage') {
        if (interaction.isButton()) {
            return selectTypeStage(interaction, client, customIdObj);
        }
        if (interaction.isAnySelectMenu()) {
            return handleSelectMenuInteraction(
                interaction,
                client,
                customIdObj,
            );
        }
    }
    const startMessageEmbed = newEmbed(
        'User Roles',
        stripIndent`
        Welcome ${userMention(interaction.user.id)}!

        Please select the action you would like to do using the buttons below.
        `,
        true,
        'Random',
    );
    buttonRow = addButton(
        buttonRow,
        { style: ButtonStyle.Primary, label: 'Choose Roles' },
        { ...customIdObj, stage: 'selectType' },
    );

    return await interaction.editReply({
        components: [buttonRow],
        embeds: [startMessageEmbed],
    });
}

async function manageRolesMenu() {}

async function selectTypeStage(
    interaction: ButtonInteraction,
    client: Client,
    customIdObj: CustomIdObj,
) {
    const { mainAction, stage } = customIdObj;
    if (stage !== 'selectType') {
        //* Go to the next stage
    }
    let buttonRow = newButtonRow(mainAction, true);
    if (Constants.Roles.isTypesEmpty()) {
        return await interaction.editReply({
            content: stripIndent`
            Whoops! There are currently no categories configured for this server.
            Please ask the server admins / moderators to set up categories using the same menu you just used.
            `,
            embeds: [],
            components: [buttonRow],
        });
    }
    if (Constants.Roles.isRolesEmpty()) {
        return await interaction.editReply({
            content: stripIndent`
            Whoops! There are currently no categories that have roles attached to them on this server.
            Please ask the server admins / moderators to attach roles to the existing categories.
            `,
            embeds: [],
            components: [buttonRow],
        });
    }
    const typeEmbed = newEmbed(
        'User Roles',
        stripIndent`
        Please select a category from the following:

        `,
        true,
        'Random',
    );
    const typesSelectMenu = newStringSelectMenuBuilderRow(
        {
            placeholder: 'Select a category:',
            options: Constants.Roles.convertTypesToOptions(),
        },
        customIdObj,
    );
    buttonRow = addButton(
        buttonRow,
        {
            label: 'Back',
            style: ButtonStyle.Secondary,
        },
        { ...customIdObj, stage: 'startMessage', anythingElse: ['back'] },
    );
    return interaction.editReply({
        content: '',
        components: [typesSelectMenu, buttonRow],
        embeds: [typeEmbed],
    });
}

export function handleSelectMenuInteraction(
    interaction: AnySelectMenuInteraction,
    client: Client,
    idObj: CustomIdObj,
) {}
