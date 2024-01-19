import {
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    Client,
    EmbedBuilder,
    ModalSubmitInteraction,
    TextInputModalData,
    codeBlock,
    escapeEscape,
    inlineCode,
    italic,
} from 'discord.js';
import {
    CustomIdObj,
    backButton,
    newButtonRow,
    newEmbed,
} from '../helpers/componentBuilders.js';
import { StoredType } from '../classes/roleConfig.js';
import { Globals } from '../helpers/globals.js';
import { stripIndent } from 'common-tags';
import { LocalUtils } from '../helpers/utils.js';
import { emptyReply, getIdentifiers } from '../helpers/discordHelpers.js';
import { RegexConstants } from '../classes/regexConstants.js';

export async function routeModalInteractions(
    interaction: ModalSubmitInteraction,
    client: Client,
    customIdObj: CustomIdObj,
) {
    await interaction.deferUpdate();
    const routes: {
        stage: string;
        execute: (
            interaction: ModalSubmitInteraction,
            client: Client,
            customIdObj: CustomIdObj,
        ) => void;
    }[] = [
        {
            stage: 'verifyTypeDetails',
            execute: verifyTypeDetails,
        },
        {
            stage: 'verifyMinMax',
            execute: verifyMinMaxStage,
        },
    ];
    const currRoute = LocalUtils.findCurrRoute(customIdObj, routes);
    if (currRoute === undefined) return;
    return currRoute.execute(interaction, client, customIdObj);
}

async function verifyTypeDetails(
    interaction: ModalSubmitInteraction,
    client: Client,
    customIdObj: CustomIdObj,
) {
    const textInputs = interaction.components;
    const inputPredicate =
        (inputName: string) => (input: TextInputModalData) => {
            return input.customId === inputName;
        };
    let typeDetails: StoredType = {
        label: '',
        description: undefined,
        value: '',
    };
    textInputs.forEach((row) => {
        const label = row.components.find(inputPredicate('label'))?.value;
        typeDetails.label = (
            label !== undefined ? label : typeDetails.label
        ).toLowerCase();
        const description = row.components.find(
            inputPredicate('description'),
        )?.value;
        typeDetails.description =
            description !== undefined ? description : typeDetails.description;
        const value = row.components.find(inputPredicate('value'))?.value;
        typeDetails.value = value !== undefined ? value : typeDetails.value;
    });
    const testResults = LocalUtils.invalidCharacters(
        typeDetails,
        RegexConstants.charactersAndNumbers,
    );
    if (testResults.invalid) {
        const buttonRow = newButtonRow('roles', true);
        buttonRow.setComponents(
            new ButtonBuilder()
                .setCustomId(
                    LocalUtils.buildCustomId({
                        ...customIdObj,
                        stage: 'newType',
                        anythingElse: [],
                    }),
                )
                .setLabel('Try again')
                .setStyle(ButtonStyle.Primary),
            backButton(customIdObj, 'startMessage'),
            ...buttonRow.components,
        );
        let invalidInputs = testResults.props
            .filter((input) => input.invalid)
            .map((input) => input.name.toLowerCase())
            .map((input) => {
                switch (input) {
                    case 'label':
                        return 'Name';
                    case 'value':
                        return 'Unique Name';
                    default:
                        return input;
                }
            });
        const embed = new EmbedBuilder(interaction.message.embeds[0]);
        embed.setDescription(`
        ${italic(stripIndent`
            The following inputs (${inlineCode(
                `${invalidInputs.join(', ')}`,
            )}) were invalid.
            Keep in mind that only numbers and letters are allowed.
            `)}
        `);

        return await interaction.editReply({
            embeds: [embed],
            components: [buttonRow],
        });
    }
    const { roleConfig } = Globals.guildConfigs.guilds.get(interaction.guildId);
    if (roleConfig.getType(typeDetails.value) !== undefined) {
        const buttonRow = newButtonRow('roles', true);
        buttonRow.setComponents(
            new ButtonBuilder().setCustomId(
                LocalUtils.buildCustomId({
                    ...customIdObj,
                    stage: 'viewTypeDetails',
                    anythingElse: [typeDetails.value],
                }),
            ),
            new ButtonBuilder()
                .setCustomId(
                    LocalUtils.buildCustomId({
                        ...customIdObj,
                        stage: 'newType',
                        anythingElse: [],
                    }),
                )
                .setLabel('Try again')
                .setStyle(ButtonStyle.Primary),
            backButton(customIdObj, 'startMessage'),
            ...buttonRow.components,
        );
        return await interaction.editReply({
            ...emptyReply,
            content: stripIndent`
            The unique name '${inlineCode(typeDetails.value)}' is already taken.
            Please choose a different one.
            
            Alternatively, you can check if the category you're trying to create already exists.
            Click 'View Category' to do so.
            `,
            components: [buttonRow],
        });
    }
    const identifiers = {
        channelId: interaction.channelId,
        messageId: interaction.message.id,
        userId: interaction.user.id,
    };
    const savedData = {
        manageRoles: {
            typeDetails,
        },
    };
    const dataToSave = {
        identifiers,
        savedData,
        expire: Date.now() + 15000 * 60,
    };
    Globals.tempData.addOrUpdateData(dataToSave);
    const confirmationEmbed = newEmbed(
        'Role Menu',
        stripIndent`
        Category details:
        Name - ${inlineCode(typeDetails.label)}
        Description - ${inlineCode(
            typeDetails.description !== ''
                ? typeDetails.description
                : 'No description provided.',
        )}
        Unique Name - ${inlineCode(typeDetails.value)}
        
        Is this correct?
        `,
        true,
        'Random',
    );

    const buttonRow = newButtonRow('roles');
    buttonRow.setComponents([
        new ButtonBuilder()
            .setCustomId(
                LocalUtils.buildCustomId({
                    ...customIdObj,
                    stage: 'isMultiRole',
                    anythingElse: [],
                }),
            )
            .setLabel('Yes')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(
                LocalUtils.buildCustomId({
                    ...customIdObj,
                    stage: 'newType',
                    anythingElse: [],
                }),
            )
            .setLabel('No')
            .setStyle(ButtonStyle.Danger),
        ...buttonRow.components,
    ]);

    return await interaction.editReply({
        content: '',
        embeds: [confirmationEmbed],
        components: [buttonRow],
    });
}

async function verifyMinMaxStage(
    interaction: ModalSubmitInteraction,
    client: Client,
    customIdObj: CustomIdObj,
) {
    let minChoices: number = 1;
    let maxChoices: number = undefined;
    const { components } = interaction;
    let anyValueNotNumber = false;
    components.forEach((row) => {
        if (anyValueNotNumber) return;
        let min = row.components.find(LocalUtils.inputPredicate('min'))?.value;
        let max = row.components.find(LocalUtils.inputPredicate('max'))?.value;
        if (min !== undefined) {
            if (isNaN(Number(min))) return (anyValueNotNumber = true);
            minChoices = Number(min);
        }
        if (max !== undefined) {
            if (isNaN(Number(max))) return (anyValueNotNumber = true);
            maxChoices = Number(max);
        }
    });
    const verifyMinMaxEmbed = newEmbed(
        'Role Menu',
        `${escapeEscape('______________')}`,
        true,
        'Random',
    );

    // Fail State
    if (anyValueNotNumber) {
        const invalidEmbed = newEmbed(
            'Role Menu',
            italic(stripIndent`
            Invalid inputs detected, only numbers are allowed.
            `),
        );
        const buttonRow = newButtonRow('roles', true);
        buttonRow.setComponents(
            new ButtonBuilder()
                .setCustomId(
                    LocalUtils.buildCustomId({
                        ...customIdObj,
                        stage: 'minMaxChoices',
                        anythingElse: [],
                    }),
                )
                .setLabel('Try again')
                .setStyle(ButtonStyle.Primary),
            backButton(customIdObj, 'startMessage').setLabel('Restart'),
            ...buttonRow.components,
        );
        return await interaction.editReply({
            content: '',
            embeds: [invalidEmbed],
            components: [buttonRow],
        });
    }
    if (minChoices < 1) {
        minChoices = 1;
        verifyMinMaxEmbed.setDescription(stripIndent`
        ${italic(
            codeBlock(
                stripIndent`
            NOTE: The input for minimum choices was below 1, which is not allowed.
            Reverting to defaults (1).
            `,
            ),
        )}
        ${
            verifyMinMaxEmbed.data.description !== undefined
                ? verifyMinMaxEmbed.data.description
                : ''
        }`);
    }
    if (maxChoices < minChoices) {
        maxChoices = 0;
        verifyMinMaxEmbed.setDescription(stripIndent`
        ${italic(
            codeBlock(
                stripIndent`
            NOTE: The input for maximum choices was below the set minimum choices, which is not allowed.
            Reverting to defaults (no limit).
            `,
            ),
        )}
        ${
            verifyMinMaxEmbed.data.description !== undefined
                ? verifyMinMaxEmbed.data.description
                : ''
        }`);
    }
    verifyMinMaxEmbed.setDescription(stripIndent`
    ${
        verifyMinMaxEmbed.data.description !== undefined
            ? verifyMinMaxEmbed.data.description
            : ''
    }    
    Current limits are:
    
    Minimum Choices - ${inlineCode(`${minChoices}`)}
    Maximum Choices - ${inlineCode(
        `${maxChoices === 0 ? 'No limit' : maxChoices}`,
    )}
    
    Is this correct?
    `);
    const typeDetails = Globals.tempData.getData(getIdentifiers(interaction))
        .savedData.manageRoles.typeDetails;
    typeDetails.minChoices = minChoices;
    typeDetails.maxChoices = maxChoices;
    Globals.tempData.addOrUpdateData({
        identifiers: getIdentifiers(interaction),
        savedData: {
            manageRoles: {
                typeDetails: typeDetails,
            },
        },
    });
    const buttonRow = newButtonRow('roles').setComponents([
        new ButtonBuilder()
            .setCustomId(
                LocalUtils.buildCustomId({
                    ...customIdObj,
                    stage: 'finishedType',
                    anythingElse: ['multiRole'],
                }),
            )
            .setLabel('Yes')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(
                LocalUtils.buildCustomId({
                    ...customIdObj,
                    stage: 'minMaxChoices',
                    anythingElse: [],
                }),
            )
            .setLabel('No')
            .setStyle(ButtonStyle.Danger),
    ]);
    return await interaction.editReply({
        content: '',
        embeds: [verifyMinMaxEmbed],
        components: [buttonRow],
    });
}
