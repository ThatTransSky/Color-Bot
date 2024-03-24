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
import { Route } from '../classes/routes.js';

export async function routeModalInteractions(
    interaction: ModalSubmitInteraction,
    client: Client,
    customIdObj: CustomIdObj,
) {
    await interaction.deferUpdate();
    const routes: Route[] = [
        {
            stage: 'verifyTypeDetails',
            execute: verifyTypeDetails,
        },
        {
            stage: 'verifyEditedTypeDetails',
            execute: verifyEditedTypeDetails,
        },
        {
            stage: 'verifyMinMax',
            execute: verifyMinMaxStage,
        },
    ];
    LocalUtils.execCurrRoute(interaction, client, customIdObj, routes);
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
        typeDetails.label = label !== undefined ? label : typeDetails.label;
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
        const tryAgainRow = newButtonRow(
            'roles',
            [
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
            ],
            true,
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
        const invalidCharsEmbed = new EmbedBuilder(
            interaction.message.embeds[0],
        );
        invalidCharsEmbed.setDescription(`
        ${italic(stripIndent`
            The following inputs (${inlineCode(
                `${invalidInputs.join(', ')}`,
            )}) were invalid.
            Keep in mind that only numbers and letters are allowed.
            `)}
        `);

        return await interaction.editReply({
            embeds: [invalidCharsEmbed],
            components: [tryAgainRow],
        });
    }
    const identifiers = {
        channelId: interaction.channelId,
        messageId: interaction.message.id,
        userId: interaction.user.id,
    };
    let valueWasNotLowercased = false;
    if (typeDetails.value !== typeDetails.value.toLowerCase()) {
        typeDetails.value = typeDetails.value.toLowerCase();
        valueWasNotLowercased = true;
    }
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
    const { roleConfig } = Globals.guildConfigs.guilds.get(interaction.guildId);
    if (roleConfig.getType(typeDetails.value) !== undefined) {
        const editOrTryAgainRow = newButtonRow(
            customIdObj.mainAction,
            [
                new ButtonBuilder()
                    .setCustomId(
                        LocalUtils.buildCustomId({
                            ...customIdObj,
                            stage: 'editType',
                            anythingElse: [],
                        }),
                    )
                    .setLabel('Edit Category')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(
                        LocalUtils.buildCustomId({
                            ...customIdObj,
                            stage: 'newType',
                            anythingElse: [],
                        }),
                    )
                    .setLabel('Try again')
                    .setStyle(ButtonStyle.Secondary),
                backButton(customIdObj, 'startMessage'),
            ],
            true,
        );
        return await interaction.editReply({
            ...emptyReply,
            content: stripIndent`
            The unique name '${inlineCode(typeDetails.value)}' is already taken.
            Please choose a different one.
            
            Alternatively, you can edit the existing category you're trying to create.
            Click 'Edit Category' to do so.
            `,
            components: [editOrTryAgainRow],
        });
    }
    const confirmationEmbed = newEmbed(
        'Role Menu',
        stripIndent`
        ${
            valueWasNotLowercased
                ? italic(
                      `(Note: The category's Unique Name has to be lowercased and has been converted)`,
                  )
                : ''
        }

        Category details:
        Name - ${inlineCode(typeDetails.label)}
        Description - ${inlineCode(
            !LocalUtils.isStringEmpty(typeDetails.description)
                ? typeDetails.description
                : 'No description provided.',
        )}
        Unique Name - ${inlineCode(typeDetails.value)}
        
        Is this correct?
        `,
        true,
        'Random',
    );

    const isMultiRoleRow = newButtonRow('roles', [
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
    ]);

    return await interaction.editReply({
        content: '',
        embeds: [confirmationEmbed],
        components: [isMultiRoleRow],
    });
}

async function verifyEditedTypeDetails(
    interaction: ModalSubmitInteraction,
    client: Client,
    customIdObj: CustomIdObj,
) {
    const textInputs = interaction.components;
    const inputPredicate =
        (inputName: string) => (input: TextInputModalData) => {
            return input.customId === inputName;
        };

    /**
     * Keeping this line here as a reminder:
     * !GETTING AN OBJECT RETURNS A REFERENCE TO THEM
     *
     * I lost so much sleep over this...
     */
    let currType = Globals.tempData.getData(getIdentifiers(interaction))
        .savedData.manageRoles.typeDetails;
    let editedType: StoredType = {
        ...currType,
        label: '',
        description: undefined,
        value: '',
    };
    let label = '';
    let description = undefined;
    let value = '';
    textInputs.forEach((row) => {
        if (LocalUtils.isStringEmpty(label)) {
            label = row.components.find(inputPredicate('label'))?.value;
            editedType.label = label !== undefined ? label : '';
        }
        if (LocalUtils.isStringEmpty(description)) {
            description = row.components.find(
                inputPredicate('description'),
            )?.value;
            editedType.description =
                description !== undefined ? description : undefined;
        }
        if (LocalUtils.isStringEmpty(value)) {
            value = row.components.find(inputPredicate('value'))?.value;
            editedType.value = value !== undefined ? value : '';
        }
    });
    const testResults = LocalUtils.invalidCharacters(
        {
            label: editedType.label,
            value: editedType.value,
        },
        RegexConstants.charactersAndNumbers,
    );
    // Fail state
    if (testResults.invalid) {
        const tryAgainRow = newButtonRow(
            'roles',
            [
                new ButtonBuilder()
                    .setCustomId(
                        LocalUtils.buildCustomId({
                            ...customIdObj,
                            stage: 'editType',
                            anythingElse: [],
                        }),
                    )
                    .setLabel('Try again')
                    .setStyle(ButtonStyle.Primary),
                backButton(customIdObj, 'viewType'),
            ],
            true,
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
        const invalidCharsEmbed = new EmbedBuilder(
            interaction.message.embeds[0],
        );
        invalidCharsEmbed.setDescription(`
        ${italic(stripIndent`
            The following inputs (${inlineCode(
                `${invalidInputs.join(', ')}`,
            )}) were invalid.
            Keep in mind that only numbers and letters are allowed.
            `)}
        `);

        return await interaction.editReply({
            embeds: [invalidCharsEmbed],
            components: [tryAgainRow],
        });
    }

    let valueWasNotLowercased = false;
    if (editedType.value !== editedType.value.toLowerCase()) {
        editedType.value = editedType.value.toLowerCase();
        valueWasNotLowercased = true;
    }
    Globals.tempData.updateTypeInData(
        getIdentifiers(interaction),
        editedType,
        'edit',
    );
    const confirmationEmbed = newEmbed(
        'Role Menu',
        stripIndent`
        ${
            valueWasNotLowercased
                ? italic(
                      `(Note: The category's Unique Name has to be lowercased and has been converted)`,
                  )
                : ''
        }

        Category details:

        Name - ${inlineCode(editedType.label)} 
        Description - ${inlineCode(
            !LocalUtils.isStringEmpty(editedType.description)
                ? editedType.description
                : 'No description provided.',
        )}
        Unique Name - ${inlineCode(editedType.value)}
        
        Is this correct?
        `,
        true,
        'Random',
    );

    const isCorrectRow = newButtonRow('roles', [
        new ButtonBuilder()
            .setCustomId(
                LocalUtils.buildCustomId({
                    ...customIdObj,
                    stage: 'finishedEditingType',
                    anythingElse: [],
                }),
            )
            .setLabel('Yes')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(
                LocalUtils.buildCustomId({
                    ...customIdObj,
                    stage: 'editType',
                    anythingElse: [],
                }),
            )
            .setLabel('No')
            .setStyle(ButtonStyle.Danger),
    ]);

    return await interaction.editReply({
        content: '',
        embeds: [confirmationEmbed],
        components: [isCorrectRow],
    });
}

async function verifyMinMaxStage(
    interaction: ModalSubmitInteraction,
    client: Client,
    customIdObj: CustomIdObj,
) {
    let minChoices: number = 1;
    let maxChoices: number = 25;
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

    const verifyMinMaxEmbed = newEmbed('Role Menu', ``, true, 'Random');

    // Fail State
    if (anyValueNotNumber) {
        const invalidEmbed = newEmbed(
            'Role Menu',
            italic(stripIndent`
            Invalid inputs detected, only numbers are allowed.
            `),
        );
        const buttonRow = newButtonRow(
            'roles',
            [
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
            ],
            true,
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
        maxChoices = 25;
        verifyMinMaxEmbed.setDescription(stripIndent`
        ${italic(
            codeBlock(
                stripIndent`
                NOTE: The input for maximum choices was below the set minimum choices, which is not allowed.
                Reverting to defaults (25).
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
    const buttonRow = newButtonRow('roles', [
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
