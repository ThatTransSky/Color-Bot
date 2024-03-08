import { stripIndent } from 'common-tags';
import {
    ActionRowBuilder,
    AnySelectMenuInteraction,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    Client,
    GuildMember,
    Interaction,
    ModalBuilder,
    PermissionFlagsBits,
    Role,
    StringSelectMenuBuilder,
    TextInputBuilder,
    TextInputStyle,
    inlineCode,
    italic,
    roleMention,
    userMention,
} from 'discord.js';
import {
    CustomIdObj,
    backButton,
    exitButton,
    newButtonRow,
    newEmbed,
    newStringSelectMenuBuilderRow,
    nextPreviousAndCurrentButtons,
} from '../helpers/componentBuilders.js';
import { Globals } from '../helpers/globals.js';
import { LocalUtils } from '../helpers/utils.js';
import {
    checkRolesAgainstUser,
    checkRolesToReplace,
    getIdentifiers,
    getRoleConfig,
} from '../helpers/discordHelpers.js';
import { exitInteraction } from './miscHandlers.js';
import { routeModalInteractions } from './handleModal.js';
import { Route } from '../classes/routes.js';

export async function routeRoleInteraction(
    interaction: Interaction,
    client: Client,
    customIdObj: CustomIdObj,
) {
    if (
        interaction.isCommand() ||
        interaction.isAutocomplete() ||
        customIdObj.mainAction !== 'roles'
    ) {
        client.emit(
            'warn',
            `routeRoleInteraction - Unexpected interaction type, got ${LocalUtils.interactionTypeToString(
                interaction,
            )}`,
        );
        return;
    }
    if (interaction.isModalSubmit()) {
        return routeModalInteractions(interaction, client, customIdObj);
    }
    const respondingWithModalStages = ['newType', 'minMaxChoices'];
    if (!respondingWithModalStages.includes(customIdObj.stage)) {
        if (
            customIdObj.secondaryAction === 'start' &&
            customIdObj.stage === 'startRoleMenu' &&
            !customIdObj.anythingElse.includes('back')
        ) {
            await interaction.deferReply({ ephemeral: true });
        } else await interaction.deferUpdate();
    }
    const routes: Route[] = [
        // Initial Route
        {
            secondaryAction: 'start',
            stage: 'startRoleMenu',
            execute: startRoute,
        },
        // Manage Routes
        {
            secondaryAction: 'manageRoles',
            stage: 'startMessage',
            execute: mainManageRolesMenu,
        },
        {
            secondaryAction: 'manageRoles',
            stage: 'newType',
            execute: newTypeStage,
        },
        {
            secondaryAction: 'manageRoles',
            stage: 'isMultiRole',
            execute: isMultiRoleStage,
        },
        {
            secondaryAction: 'manageRoles',
            stage: 'minMaxChoices',
            execute: chooseMinMaxChoices,
        },
        {
            secondaryAction: 'manageRoles',
            stage: 'finishedType',
            execute: finishedTypeStage,
        },
        // Regular Routes
        {
            secondaryAction: 'userRoles',
            stage: 'selectType',
            execute: selectTypeStage,
        },
        {
            secondaryAction: 'userRoles',
            stage: 'selectRole',
            execute: selectRoleStage,
        },
        {
            secondaryAction: 'userRoles',
            stage: 'rolesSelected',
            execute: rolesSelectedStage,
        },
        {
            secondaryAction: 'userRoles',
            stage: 'applyRoles',
            execute: applyChangesStage,
        },
    ];
    const currRoute = LocalUtils.findCurrRoute(customIdObj, routes);
    if (currRoute === undefined) return;
    return currRoute.execute(interaction, client, customIdObj);
}

// Initial Route

async function startRoute(
    interaction: ButtonInteraction,
    client: Client,
    customIdObj: CustomIdObj,
) {
    const chooseActionEmbed = newEmbed(
        'Role Menu',
        stripIndent`
        Welcome ${userMention(interaction.user.id)}!

        To choose your roles, click 'Choose Roles'.

        To manage the roles that are added to this bot, click 'Manage Roles'.
        ${italic(
            'Note: You need to have `Manage Roles` permissions to use this feature.',
        )}
        `,
    );

    const buttonRow = newButtonRow('roles', true);
    const manageRolesButton = new ButtonBuilder()
        .setCustomId(
            LocalUtils.buildCustomId({
                ...customIdObj,
                secondaryAction: 'manageRoles',
                stage: 'startMessage',
                anythingElse: [],
            }),
        )
        .setLabel('Manage Roles')
        .setStyle(ButtonStyle.Primary);
    if (!interaction.memberPermissions.has('ManageRoles', true)) {
        manageRolesButton.setDisabled(true);
    }
    buttonRow.setComponents([
        new ButtonBuilder()
            .setCustomId(
                LocalUtils.buildCustomId({
                    ...customIdObj,
                    secondaryAction: 'userRoles',
                    stage: 'selectType',
                    anythingElse: [],
                }),
            )
            .setLabel('Choose Roles')
            .setStyle(ButtonStyle.Success),
        manageRolesButton,
        ...buttonRow.components,
    ]);
    return await interaction.editReply({
        content: '',
        embeds: [chooseActionEmbed],
        components: [buttonRow],
    });
}

//
//
//
// Manage Routes
//
//
//

async function mainManageRolesMenu(
    interaction: ButtonInteraction,
    client: Client,
    customIdObj: CustomIdObj,
) {
    if (
        !interaction.memberPermissions.has(
            PermissionFlagsBits.ManageRoles,
            true,
        )
    ) {
        return await interaction.editReply({
            content:
                'You lack the sufficient permissions to perform this action!',
        });
    }
    const roleConfig = getRoleConfig(interaction.guildId);
    const welcomeEmbed = newEmbed(
        'Role Menu',
        stripIndent`        
        Choose the category you would like to edit or
        add another category by clicking 'New Category'.

        ${
            roleConfig.isTypesEmpty()
                ? italic(
                      'Note: There are no current categories. Please add some using the button below.',
                  )
                : ''
        }
        `,
        true,
        'Random',
    );
    const buttonRow = newButtonRow('roles').setComponents([
        new ButtonBuilder()
            .setCustomId(
                LocalUtils.buildCustomId({
                    ...customIdObj,
                    stage: 'newType',
                    anythingElse: [],
                }),
            )
            .setLabel('New Category')
            .setStyle(ButtonStyle.Primary),
        backButton({
            ...customIdObj,
            stage: 'startRoleMenu',
            secondaryAction: 'start',
            anythingElse: ['back'],
        }),
        exitButton('roles'),
    ]);
    const categorySelectionRow =
        new ActionRowBuilder<StringSelectMenuBuilder>().setComponents([
            new StringSelectMenuBuilder()
                .setCustomId(
                    LocalUtils.buildCustomId({
                        ...customIdObj,
                        stage: 'editCategory',
                        anythingElse: [],
                    }),
                )
                .setOptions(roleConfig.convertTypesToOptions()),
        ]);
    return await interaction.editReply({
        content: '',
        components: roleConfig.isTypesEmpty()
            ? [buttonRow]
            : [categorySelectionRow, buttonRow],
        embeds: [welcomeEmbed],
    });
}

async function newTypeStage(
    interaction: ButtonInteraction,
    client: Client,
    customIdObj: CustomIdObj,
) {
    const nameInput = new ActionRowBuilder<TextInputBuilder>().setComponents(
        new TextInputBuilder()
            .setCustomId('label')
            .setLabel('Name')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setPlaceholder('This is the name that users will see.'),
    );
    const descriptionInput =
        new ActionRowBuilder<TextInputBuilder>().setComponents(
            new TextInputBuilder()
                .setCustomId('description')
                .setLabel('Description')
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
                .setPlaceholder('Leave empty for no description.'),
        );
    const valueInput = new ActionRowBuilder<TextInputBuilder>().setComponents(
        new TextInputBuilder()
            .setCustomId('value')
            .setLabel('Internal Name')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setPlaceholder('Like an ID, Has to be unique!'),
    );
    return await interaction.showModal(
        new ModalBuilder()
            .setCustomId(
                LocalUtils.buildCustomId({
                    ...customIdObj,
                    stage: 'verifyTypeDetails',
                    anythingElse: [],
                }),
            )
            .setComponents(nameInput, descriptionInput, valueInput)
            .setTitle('Category Details'),
    );
}

async function isMultiRoleStage(
    interaction: ButtonInteraction,
    client: Client,
    customIdObj: CustomIdObj,
) {
    const embed = newEmbed(
        'Role Menu',
        stripIndent`
        Should this category be multi-role? (if users should be allowed to 
        pick more than one role in this category)
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
                    stage: 'minMaxChoices',
                    anythingElse: [],
                }),
            )
            .setLabel('Yes')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(
                LocalUtils.buildCustomId({
                    ...customIdObj,
                    stage: 'finishedType',
                    anythingElse: [],
                }),
            )
            .setLabel('No')
            .setStyle(ButtonStyle.Danger),
    ]);
    await interaction.editReply({
        content: '',
        embeds: [embed],
        components: [buttonRow],
    });
}

async function chooseMinMaxChoices(
    interaction: ButtonInteraction,
    client: Client,
    customIdObj: CustomIdObj,
) {
    const typeDetails = Globals.tempData.getData(getIdentifiers(interaction))
        .savedData.manageRoles.typeDetails;
    typeDetails.multiRoleType = true;
    Globals.tempData.addOrUpdateData({
        identifiers: getIdentifiers(interaction),
        savedData: {
            manageRoles: {
                typeDetails: typeDetails,
            },
        },
    });
    const minInput = new ActionRowBuilder<TextInputBuilder>().setComponents(
        new TextInputBuilder()
            .setCustomId('min')
            .setLabel('Minimum Role Choices')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setValue('1'),
    );
    const maxInput = new ActionRowBuilder<TextInputBuilder>().setComponents(
        new TextInputBuilder()
            .setCustomId('max')
            .setLabel('Maximum Role Choices')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setPlaceholder(
                'Leave empty for no limit. Has to be above minimum.',
            ),
    );

    await interaction.showModal(
        new ModalBuilder()
            .setCustomId(
                LocalUtils.buildCustomId({
                    ...customIdObj,
                    stage: 'verifyMinMax',
                    anythingElse: [],
                }),
            )
            .setComponents(minInput, maxInput)
            .setTitle('Minimum and Maximum Role Choices'),
    );
}

async function finishedTypeStage(
    interaction: ButtonInteraction,
    client: Client,
    customIdObj: CustomIdObj,
) {
    const typeDetails = Globals.tempData.getData(getIdentifiers(interaction))
        ?.savedData?.manageRoles?.typeDetails;
    if (typeDetails === undefined) {
        return await interaction.editReply({
            content: stripIndent`
            Interaction Data timed out, please try again later.
            _(Note that most data expires within 5-15 minutes)_
            `,
            embeds: [],
            components: [],
        });
    }
    const roleConfig = getRoleConfig(interaction.guildId);
    const result = roleConfig.addType(typeDetails, typeDetails.roles);
    if (!result?.success) {
        return await interaction.editReply({
            content: 'Unexpected error, reason ' + inlineCode(result.reason),
            components: [],
            embeds: [],
        });
    }
    Globals.tempData.extendExpire(getIdentifiers(interaction));
    const successEmbed = newEmbed(
        'Role Menu',
        stripIndent`
        Success!

        Category Details:
        Name - ${typeDetails.label}
        Description - ${
            typeDetails.description !== ''
                ? typeDetails.description
                : 'No description provided.'
        }
        Unique Name: ${typeDetails.value}

        Category added successfully, would like to add roles?
        Alternatively, you can restart the interaction to either edit other categories or choose some roles.
        `,
    );

    const buttonRow = newButtonRow(customIdObj.mainAction);
    buttonRow.setComponents([
        new ButtonBuilder()
            .setCustomId(
                LocalUtils.buildCustomId({
                    ...customIdObj,
                    stage: 'shouldAddRoles',
                }),
            )
            .setLabel('Yes, Add Roles')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(
                LocalUtils.buildCustomId({
                    ...customIdObj,
                    stage: 'startMessage',
                    anythingElse: ['back'],
                }),
            )
            .setLabel('Restart: Manage Roles')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(
                LocalUtils.buildCustomId({
                    ...customIdObj,
                    secondaryAction: 'userRoles',
                    stage: 'selectType',
                    anythingElse: ['back'],
                }),
            )
            .setLabel('Restart: Choose Roles')
            .setStyle(ButtonStyle.Secondary),
    ]);

    return await interaction.editReply({
        content: '',
        embeds: [successEmbed],
        components: [buttonRow],
    });
}

//
//
//
// Regular Routes
//
//
//

async function selectTypeStage(
    interaction: ButtonInteraction | AnySelectMenuInteraction,
    client: Client,
    customIdObj: CustomIdObj,
) {
    const { stage } = customIdObj;
    if (stage !== 'selectType') {
        return selectRoleStage(interaction, client, customIdObj);
    }
    let buttonRow = newButtonRow('roles', true);
    buttonRow.setComponents(
        backButton({
            ...customIdObj,
            secondaryAction: 'start',
            stage: 'startRoleMenu',
            anythingElse: ['back'],
        }),
        ...buttonRow.components,
    );
    const roleConfig = getRoleConfig(interaction.guildId);
    if (roleConfig.isTypesEmpty()) {
        return await interaction.editReply({
            content: stripIndent`
            Whoops! There are currently no categories configured for this server.
            Please ask the server admins / moderators to set up categories using the same menu you just used.
            `,
            embeds: [],
            components: [buttonRow],
        });
    }
    if (roleConfig.isRolesEmpty()) {
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
        'Role Menu',
        stripIndent`
        Please select a category from the following:

        `,
        true,
        'Random',
    );
    const typesSelectMenu = newStringSelectMenuBuilderRow(
        {
            placeholder: 'Select a category:',
            options: roleConfig.convertTypesToOptions(),
        },
        { ...customIdObj, stage: 'selectRole' },
    );
    return interaction.editReply({
        content: '',
        components: [typesSelectMenu, buttonRow],
        embeds: [typeEmbed],
    });
}

async function selectRoleStage(
    interaction: ButtonInteraction | AnySelectMenuInteraction,
    client: Client,
    customIdObj: CustomIdObj,
) {
    const { stage, anythingElse } = customIdObj;
    let type: string = interaction.isButton()
        ? anythingElse
              .find((args) => args.toLowerCase() !== 'back')
              .toLowerCase()
        : interaction.values[0].toLowerCase();
    const roleConfig = getRoleConfig(interaction.guildId);
    const roles = roleConfig.getType(type).roles;
    if (roles === undefined || roles.length === 0) {
        const backButtonRow = newButtonRow('roles', true);
        backButtonRow.setComponents([
            new ButtonBuilder()
                .setCustomId(
                    LocalUtils.buildCustomId({
                        ...customIdObj,
                        stage: 'selectType',
                        anythingElse: ['back'],
                    }),
                )
                .setLabel('Change category')
                .setStyle(ButtonStyle.Primary),
            ...backButtonRow.components,
        ]);
        return await interaction.editReply({
            content: stripIndent`
            Whoops! This category has no roles attached to it.
            Please ask the server admins / moderators to attach roles to the ${inlineCode(
                `${roleConfig.getType(type).label}`,
            )} category.
            `,
            embeds: [],
            components: [backButtonRow],
        });
    }

    const rolesAsOptions = roleConfig.getRolesFromType(type, true);
    const roleSelectMenu = newStringSelectMenuBuilderRow(
        { options: rolesAsOptions, placeholder: 'Select a role:' },
        { ...customIdObj, stage: 'rolesSelected' },
    );
    const buttonRow = newButtonRow('roles', true);
    buttonRow.setComponents(
        backButton({
            ...customIdObj,
            stage: 'selectType',
            anythingElse: ['back'],
        }),
        ...buttonRow.components,
    );
    if (roleConfig.getType(type)?.multiRoleType) {
        roleSelectMenu.components[0].data.min_values = 1;
        roleSelectMenu.components[0].data.max_values = rolesAsOptions.length;
        roleSelectMenu.components[0].data.placeholder = 'Select roles:';
    }

    const selectRolesEmbed = roleConfig.selectRolesEmbed(type);

    await interaction.editReply({
        content: '',
        components: [roleSelectMenu, buttonRow],
        embeds: [selectRolesEmbed],
    });
}

async function rolesSelectedStage(
    interaction: ButtonInteraction | AnySelectMenuInteraction,
    client: Client<boolean>,
    customIdObj: CustomIdObj,
) {
    const roleConfig = getRoleConfig(interaction.guildId);
    const roleIds = interaction.isButton()
        ? customIdObj.anythingElse.filter((args) => args !== 'back')
        : interaction.values;
    const storedRoles = roleIds.map((id) => roleConfig.getRole({ id: id }));
    if (storedRoles.length === 0)
        return LocalUtils.log('error', 'storedRoles Empty');
    const afterCheck_MultiType = async (
        rolesToRemove: Role[],
        rolesToAdd: Role[],
    ) => {
        Globals.tempData.addOrUpdateData({
            identifiers: {
                messageId: interaction.message.id,
                userId: interaction.user.id,
                channelId: interaction.channelId,
            },
            savedData: {
                roles: {
                    rolesToAdd: rolesToAdd.map((role) => role.id),
                    rolesToRemove: rolesToRemove.map((role) => role.id),
                },
            },
        });
        const roleChangesEmbed = newEmbed(
            'Role Menu',
            stripIndent`
            Please confirm these role changes:
            ${italic('Roles to add:')}
            ${
                rolesToAdd.length > 0
                    ? rolesToAdd.map((role) => roleMention(role.id)).join('\n')
                    : italic('None\n')
            }
            ${italic('Roles to remove:')}
            ${
                rolesToRemove.length > 0
                    ? rolesToRemove
                          .map((role) => roleMention(role.id))
                          .join('\n')
                    : italic('None\n')
            }
            `,
            true,
            'Random',
        );
        const buttonRow = newButtonRow('roles', true);
        buttonRow.setComponents([
            new ButtonBuilder({
                style: ButtonStyle.Primary,
                label: 'Apply Changes',
            }).setCustomId(
                LocalUtils.buildCustomId({
                    ...customIdObj,
                    stage: 'applyRoles',
                    anythingElse: ['all'],
                }),
            ),
            new ButtonBuilder({
                style: ButtonStyle.Success,
                label: 'Only Add Roles',
                disabled:
                    (rolesToRemove.length === 0 && rolesToAdd.length !== 0) ||
                    rolesToAdd.length === 0,
            }).setCustomId(
                LocalUtils.buildCustomId({
                    ...customIdObj,
                    stage: 'applyRoles',
                    anythingElse: ['add'],
                }),
            ),
            backButton({
                ...customIdObj,
                stage: 'selectRole',
                anythingElse: ['back', storedRoles[0].type],
            }),
            ...buttonRow.components,
        ]);

        await interaction.editReply({
            content: '',
            components: [buttonRow],
            embeds: [roleChangesEmbed],
        });
    };
    const afterCheck = async (roleToReplace: Role) => {
        const replyWithRemoval = async () => {
            const roleRemovalEmbed = newEmbed(
                'Role Menu',
                stripIndent`
            You already have the role ${roleMention(storedRoles[0].id)}!
            Do you want to remove it?
            `,
                true,
                'Random',
            );
            const removalButtonRow = newButtonRow(customIdObj.mainAction, true);
            removalButtonRow.setComponents([
                new ButtonBuilder({
                    style: ButtonStyle.Danger,
                    label: 'Remove Role',
                }).setCustomId(
                    LocalUtils.buildCustomId({
                        ...customIdObj,
                        stage: 'applyRoles',
                        anythingElse: ['remove'],
                    }),
                ),
                backButton({
                    ...customIdObj,
                    stage: 'selectRole',
                    anythingElse: ['back', storedRoles[0].type],
                }),
                ...removalButtonRow.components,
            ]);
            Globals.tempData.addOrUpdateData({
                identifiers: {
                    messageId: interaction.message.id,
                    userId: interaction.user.id,
                    channelId: interaction.channelId,
                },
                savedData: {
                    roles: {
                        rolesToAdd: [],
                        rolesToRemove: [storedRoles[0].id],
                    },
                },
            });
            await interaction.editReply({
                content: '',
                embeds: [roleRemovalEmbed],
                components: [removalButtonRow],
            });
        };
        const replyWithAddition = async () => {
            Globals.tempData.addOrUpdateData({
                identifiers: {
                    messageId: interaction.message.id,
                    userId: interaction.user.id,
                    channelId: interaction.channelId,
                },
                savedData: {
                    roles: {
                        rolesToAdd: [storedRoles[0].id],
                        rolesToRemove:
                            roleToReplace !== null &&
                            roleToReplace !== undefined
                                ? [roleToReplace.id]
                                : [],
                    },
                },
            });
            const roleAdditionEmbed = newEmbed(
                'Role Menu',
                stripIndent`
                Are you sure you want to add the role ${roleMention(
                    storedRoles[0].id,
                )}?
                ${
                    roleToReplace !== undefined && roleToReplace !== null
                        ? italic(
                              `(It will replace the role ${roleMention(
                                  roleToReplace.id,
                              )})`,
                          )
                        : ''
                }
                `,
                true,
                'Random',
            );
            const additionButtonRow = newButtonRow(
                customIdObj.mainAction,
                true,
            );
            additionButtonRow.setComponents([
                new ButtonBuilder({
                    style: ButtonStyle.Primary,
                    label: 'Apply Changes',
                }).setCustomId(
                    LocalUtils.buildCustomId({
                        ...customIdObj,
                        stage: 'applyRoles',
                        anythingElse: ['replace'],
                    }),
                ),
                backButton({
                    ...customIdObj,
                    stage: 'selectRole',
                    anythingElse: ['back', storedRoles[0].type],
                }),
                ...additionButtonRow.components,
            ]);
            await interaction.editReply({
                content: '',
                embeds: [roleAdditionEmbed],
                components: [additionButtonRow],
            });
        };
        //! NOTE: `null` means that the role to replace
        //! was the same as the role to add.
        return roleToReplace !== null
            ? await replyWithAddition()
            : await replyWithRemoval();
    };

    roleConfig.getType(storedRoles[0].type)?.multiRoleType === true
        ? checkRolesAgainstUser(
              storedRoles.map((storedRole) => storedRole.id),
              interaction.member as GuildMember,
              afterCheck_MultiType,
          )
        : checkRolesToReplace(
              storedRoles[0].id,
              interaction.member as GuildMember,
              afterCheck,
          );
}

async function applyChangesStage(
    interaction: ButtonInteraction,
    client: Client,
    customIdObj: CustomIdObj,
) {
    const roleConfig = getRoleConfig(interaction.guildId);
    const applyChanges = async () => {
        const roleType =
            rolesToAdd.length !== 0
                ? roleConfig.getRole({ id: rolesToAdd[0] }).type
                : roleConfig.getRole({ id: rolesToRemove[0] }).type;
        const firstButtonRow = newButtonRow(customIdObj.mainAction, false);
        firstButtonRow.setComponents([
            ...nextPreviousAndCurrentButtons(roleConfig, customIdObj, roleType),
        ]);
        const secondButtonRow = newButtonRow(customIdObj.mainAction, true);
        secondButtonRow.setComponents([
            new ButtonBuilder()
                .setStyle(ButtonStyle.Secondary)
                .setLabel('Back: Category Selection')
                .setCustomId(
                    LocalUtils.buildCustomId({
                        ...customIdObj,
                        stage: 'selectType',
                        anythingElse: ['back'],
                    }),
                ),
            new ButtonBuilder()
                .setCustomId(
                    LocalUtils.buildCustomId({
                        ...customIdObj,
                        secondaryAction: 'start',
                        stage: 'startRoleMenu',
                        anythingElse: ['back'],
                    }),
                )
                .setLabel('Restart: Main Menu')
                .setStyle(ButtonStyle.Secondary),
            ...secondButtonRow.components,
        ]);
        if (rolesToAdd.length !== 0) {
            await memberRoles.add(rolesToAdd, 'Role Bot');
        }
        if (rolesToRemove.length !== 0) {
            await memberRoles.remove(rolesToRemove, 'Role Bot');
        }
        const afterChangesEmbed = newEmbed(
            'Role Menu',
            stripIndent`
            Success!

            Added:
            ${rolesToAdd
                .filter((id) => memberRoles.cache.has(id))
                .map((id) => roleMention(id))
                .join('\n')}

            Removed:
            ${rolesToRemove
                .filter((id) => !memberRoles.cache.has(id))
                .map((id) => roleMention(id))
                .join('\n')}

            Select an action below:
            `,
            true,
            'Random',
        );
        return await interaction.editReply({
            content: '',
            components: [firstButtonRow, secondButtonRow],
            embeds: [afterChangesEmbed],
        });
    };
    const onlyAddRoles = async () => {
        if (rolesToAdd.length === 0) {
            LocalUtils.log(
                'error',
                'got to onlyAddRoles with rolesToAdd being empty',
            );
            await interaction.editReply({
                content: 'Something went wrong, please try again later.',
                components: [],
                embeds: [],
            });
            return setTimeout(() => exitInteraction(interaction), 10000);
        }
        const roleType = roleConfig.getRole({ id: rolesToAdd[0] }).type;
        const buttonRow = newButtonRow(customIdObj.mainAction, true);
        buttonRow.setComponents([
            ...nextPreviousAndCurrentButtons(roleConfig, customIdObj, roleType),
            new ButtonBuilder({
                label: 'Restart',
                style: ButtonStyle.Secondary,
                customId: LocalUtils.buildCustomId({
                    ...customIdObj,
                    stage: 'startMessage',
                    anythingElse: ['back'],
                }),
            }),
            ...buttonRow.components,
        ]);
        await memberRoles.add(rolesToAdd, 'Role Bot');
        const rolesAddedEmbed = newEmbed(
            'Role Menu',
            stripIndent`
            Success!

            Added:
            ${rolesToAdd
                .filter((id) => memberRoles.cache.has(id))
                .map((id) => roleMention(id))
                .join('\n')}
            
            Select an action below:
            `,
            true,
            'Random',
        );
        return await interaction.editReply({
            content: '',
            components: [buttonRow],
            embeds: [rolesAddedEmbed],
        });
    };
    const removeRole = async () => {
        const roleType = roleConfig.getRole({ id: rolesToRemove[0] }).type;
        const buttonRow = newButtonRow(customIdObj.mainAction, true);
        buttonRow.setComponents([
            ...nextPreviousAndCurrentButtons(roleConfig, customIdObj, roleType),
            new ButtonBuilder({
                label: 'Restart',
                style: ButtonStyle.Secondary,
                customId: LocalUtils.buildCustomId({
                    ...customIdObj,
                    stage: 'startMessage',
                    anythingElse: ['back'],
                }),
            }),
            ...buttonRow.components,
        ]);
        await memberRoles.remove(rolesToRemove, 'Role Bot');
        const rolesRemovedEmbed = newEmbed(
            'Role Menu',
            stripIndent`
            Successfully removed ${roleMention(rolesToRemove[0])}!

            Select an action below:
            `,
            true,
            'Random',
        );
        return await interaction.editReply({
            content: '',
            components: [buttonRow],
            embeds: [rolesRemovedEmbed],
        });
    };
    const replaceRole = async () => {
        const roleType = roleConfig.getRole({ id: rolesToAdd[0] }).type;
        const buttonRow = newButtonRow(customIdObj.mainAction, true);
        buttonRow.setComponents([
            ...nextPreviousAndCurrentButtons(roleConfig, customIdObj, roleType),
            new ButtonBuilder({
                label: 'Restart',
                style: ButtonStyle.Secondary,
                customId: LocalUtils.buildCustomId({
                    ...customIdObj,
                    stage: 'startMessage',
                    anythingElse: ['back'],
                }),
            }),
            ...buttonRow.components,
        ]);
        await memberRoles.add(rolesToAdd, 'Role Bot');
        if (rolesToRemove.length !== 0) {
            await memberRoles.remove(rolesToRemove, 'Role Bot');
        }
        const rolesReplacedEmbed = newEmbed(
            'Role Menu',
            stripIndent`
            ${
                rolesToRemove.length !== 0
                    ? `Successfully replaced ${roleMention(
                          rolesToRemove[0],
                      )} with ${roleMention(rolesToAdd[0])}!`
                    : `Successfully added ${roleMention(rolesToAdd[0])}!`
            }

            Select an action below:
            `,
            true,
            'Random',
        );
        return await interaction.editReply({
            content: '',
            components: [buttonRow],
            embeds: [rolesReplacedEmbed],
        });
    };
    const tempData = Globals.tempData.getData(getIdentifiers(interaction));
    if (tempData === undefined) {
        const expiredDataEmbed = newEmbed(
            'Role Menu',
            stripIndent`
                Looks like the previous interaction expired (The data expires after 5 minutes).
                Please try again.
                `,
            true,
            'Random',
        );
        const buttonRow = newButtonRow(customIdObj.mainAction, true);
        buttonRow.setComponents([
            new ButtonBuilder({
                style: ButtonStyle.Secondary,
                label: 'Restart Selection',
                customId: LocalUtils.buildCustomId({
                    ...customIdObj,
                    stage: 'selectType',
                }),
            }),
            ...buttonRow.components,
        ]);
        return await interaction.editReply({
            content: '',
            components: [buttonRow],
            embeds: [expiredDataEmbed],
        });
    }
    const { rolesToRemove, rolesToAdd } = tempData.savedData.roles;
    const memberRoles =
        interaction.member instanceof GuildMember
            ? interaction.member.roles
            : undefined;
    if (memberRoles === undefined) {
        return LocalUtils.log(
            'error',
            'interaction.member did not return GuildMember',
        );
    }
    const desiredAction = customIdObj.anythingElse.filter(
        (val) => val != 'back',
    )[0];
    switch (desiredAction) {
        case 'all':
            return applyChanges();
        case 'replace':
            return replaceRole();
        case 'add':
            return onlyAddRoles();
        case 'remove':
            return removeRole();
        default:
            return;
    }
}
