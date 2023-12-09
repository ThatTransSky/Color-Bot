import { stripIndent } from 'common-tags';
import {
    AnySelectMenuInteraction,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    Client,
    GuildMember,
    Interaction,
    Role,
    italic,
    roleMention,
    userMention,
} from 'discord.js';
import {
    CustomIdObj,
    addButton,
    backButton,
    newButtonRow,
    newEmbed,
    newStringSelectMenuBuilderRow,
    nextPreviousAndCurrentButtons,
} from '../helpers/componentBuilders.js';
import { Globals } from '../helpers/globals.js';
import {
    buildCustomId,
    interactionTypeToString,
    jsonString,
    log,
} from '../helpers/utils.js';
import {
    checkRolesAgainstUser,
    checkRolesToReplace,
} from '../helpers/discordHelpers.js';
import { exitInteraction } from './miscHandlers.js';

export async function routeRoleInteraction(
    interaction: Interaction,
    client: Client,
    customIdObj: CustomIdObj,
) {
    if (customIdObj.secondaryAction === 'manageRoles') {
        manageRolesMenu();
        return;
    }
    if (
        interaction.isCommand() ||
        interaction.isAutocomplete() ||
        interaction.isModalSubmit() ||
        customIdObj.mainAction !== 'roles'
    ) {
        client.emit(
            'warn',
            `routeRoleInteraction - Unexpected interaction type, got ${interactionTypeToString(
                interaction,
            )}`,
        );
        return;
    }
    if (
        customIdObj.stage === 'startMessage' &&
        !customIdObj.anythingElse.includes('back')
    ) {
        await interaction.deferReply({ ephemeral: true });
    } else await interaction.deferUpdate();
    const routes: {
        stage: string;
        execute: (
            interaction: ButtonInteraction | AnySelectMenuInteraction,
            client: Client,
            customIdObj: CustomIdObj,
        ) => void;
    }[] = [
        { stage: 'startMessage', execute: mainRoleMenu },
        { stage: 'selectType', execute: selectTypeStage },
        { stage: 'selectRole', execute: selectRoleStage },
        { stage: 'rolesSelected', execute: rolesSelectedStage },
        { stage: 'applyRoles', execute: applyChangesStage },
    ];
    const currRoute = routes.find((route) => route.stage === customIdObj.stage);
    if (currRoute === undefined) {
        client.emit(
            'error',
            new Error(
                `routeRoleInteraction - ${customIdObj.stage} is missing from routes!`,
            ),
        );
        return;
    }
    if (currRoute.execute === undefined) {
        client.emit(
            'error',
            new Error(
                `routeRoleInteraction - ${customIdObj.stage} exists but is missing its handling function!`,
            ),
        );
        return;
    }
    return currRoute.execute(interaction, client, customIdObj);
}

async function mainRoleMenu(
    interaction: ButtonInteraction | AnySelectMenuInteraction,
    client: Client,
    customIdObj: CustomIdObj,
) {
    const { mainAction } = customIdObj;
    let buttonRow = newButtonRow(mainAction, true);
    const startMessageEmbed = newEmbed(
        'User Roles',
        stripIndent`
        Welcome ${userMention(interaction.user.id)}!

        Please select the action you would like to do using the buttons below.

        `,
        true,
        'Random',
    );
    // startMessageEmbed.setFooter({ text: `Dev Mode: ${Globals.devMode}` });
    buttonRow.setComponents(
        addButton(
            { style: ButtonStyle.Primary, label: 'Change Roles' },
            { ...customIdObj, stage: 'selectType' },
        ),
        ...buttonRow.components,
    );

    await interaction.editReply({
        components: [buttonRow],
        embeds: [startMessageEmbed],
    });
}

async function manageRolesMenu() {}

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
    if (Globals.Roles.isTypesEmpty()) {
        return await interaction.editReply({
            content: stripIndent`
            Whoops! There are currently no categories configured for this server.
            Please ask the server admins / moderators to set up categories using the same menu you just used.
            `,
            embeds: [],
            components: [buttonRow],
        });
    }
    if (Globals.Roles.isRolesEmpty()) {
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
            options: Globals.Roles.convertTypesToOptions(),
        },
        { ...customIdObj, stage: 'selectRole' },
    );
    buttonRow.setComponents(
        backButton({
            ...customIdObj,
            stage: 'startMessage',
            anythingElse: ['back'],
        }),
        ...buttonRow.components,
    );
    return interaction.editReply({
        content: '',
        components: [typesSelectMenu, buttonRow],
        embeds: [typeEmbed],
    });
}

export async function selectRoleStage(
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

    const { Roles } = Globals;
    const rolesAsOptions = Roles.getRolesFromType(type, true);
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
    if (Roles.getType(type)?.multiRoleType) {
        roleSelectMenu.components[0].data.min_values = 1;
        roleSelectMenu.components[0].data.max_values = rolesAsOptions.length;
        roleSelectMenu.components[0].data.placeholder = 'Select roles:';
    }

    const selectRolesEmbed = Roles.selectRolesEmbed(type);

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
    const { Roles } = Globals;
    const roleIds = interaction.isButton()
        ? customIdObj.anythingElse.filter((args) => args !== 'back')
        : interaction.values;
    const storedRoles = roleIds.map((id) => Roles.getRole({ id: id }));
    if (storedRoles.length === 0) return log('error', 'storedRoles Empty');
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
                rolesToAdd: rolesToAdd.map((role) => role.id),
                rolesToRemove: rolesToRemove.map((role) => role.id),
            },
        });
        const roleChangesEmbed = newEmbed(
            'User Roles',
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
                buildCustomId({
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
                buildCustomId({
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
                'User Roles',
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
                    buildCustomId({
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
                    rolesToAdd: [],
                    rolesToRemove: [storedRoles[0].id],
                },
            });
            await interaction.editReply({
                content: '',
                embeds: [roleRemovalEmbed],
                components: [removalButtonRow],
            });
        };
        const replyWithAddition = async () => {
            // log('log', 'boo');
            Globals.tempData.addOrUpdateData({
                identifiers: {
                    messageId: interaction.message.id,
                    userId: interaction.user.id,
                    channelId: interaction.channelId,
                },
                savedData: {
                    rolesToAdd: [storedRoles[0].id],
                    rolesToRemove:
                        roleToReplace !== null && roleToReplace !== undefined
                            ? [roleToReplace.id]
                            : [],
                },
            });
            const roleAdditionEmbed = newEmbed(
                'User Roles',
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
                    buildCustomId({
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

    Roles.getType(storedRoles[0].type)?.multiRoleType === true
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
    const applyChanges = async () => {
        const roleType =
            rolesToAdd.length !== 0
                ? Globals.Roles.getRole({ id: rolesToAdd[0] }).type
                : Globals.Roles.getRole({ id: rolesToRemove[0] }).type;
        const buttonRow = newButtonRow(customIdObj.mainAction, true);
        buttonRow.setComponents([
            ...nextPreviousAndCurrentButtons(customIdObj, roleType),
            new ButtonBuilder({
                label: 'Restart',
                style: ButtonStyle.Secondary,
                customId: buildCustomId({
                    ...customIdObj,
                    stage: 'startMessage',
                    anythingElse: ['back'],
                }),
            }),
            ...buttonRow.components,
        ]);
        if (rolesToAdd.length !== 0) {
            await memberRoles.add(rolesToAdd, 'Role Bot');
        }
        if (rolesToRemove.length !== 0) {
            await memberRoles.remove(rolesToRemove, 'Role Bot');
        }
        const afterChangesEmbed = newEmbed(
            'User Roles',
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
            components: [buttonRow],
            embeds: [afterChangesEmbed],
        });
    };
    const onlyAddRoles = async () => {
        if (rolesToAdd.length === 0) {
            log('error', 'got to onlyAddRoles with rolesToAdd being empty');
            await interaction.editReply({
                content: 'Something went wrong, please try again later.',
                components: [],
                embeds: [],
            });
            return setTimeout(() => exitInteraction(interaction), 10000);
        }
        const roleType = Globals.Roles.getRole({ id: rolesToAdd[0] }).type;
        const buttonRow = newButtonRow(customIdObj.mainAction, true);
        buttonRow.setComponents([
            ...nextPreviousAndCurrentButtons(customIdObj, roleType),
            new ButtonBuilder({
                label: 'Restart',
                style: ButtonStyle.Secondary,
                customId: buildCustomId({
                    ...customIdObj,
                    stage: 'startMessage',
                    anythingElse: ['back'],
                }),
            }),
            ...buttonRow.components,
        ]);
        await memberRoles.add(rolesToAdd, 'Role Bot');
        const rolesAddedEmbed = newEmbed(
            'User Roles',
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
        const roleType = Globals.Roles.getRole({ id: rolesToRemove[0] }).type;
        const buttonRow = newButtonRow(customIdObj.mainAction, true);
        buttonRow.setComponents([
            ...nextPreviousAndCurrentButtons(customIdObj, roleType),
            new ButtonBuilder({
                label: 'Restart',
                style: ButtonStyle.Secondary,
                customId: buildCustomId({
                    ...customIdObj,
                    stage: 'startMessage',
                    anythingElse: ['back'],
                }),
            }),
            ...buttonRow.components,
        ]);
        await memberRoles.remove(rolesToRemove, 'Role Bot');
        const rolesRemovedEmbed = newEmbed(
            'User Roles',
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
        const roleType = Globals.Roles.getRole({ id: rolesToAdd[0] }).type;
        const buttonRow = newButtonRow(customIdObj.mainAction, true);
        buttonRow.setComponents([
            ...nextPreviousAndCurrentButtons(customIdObj, roleType),
            new ButtonBuilder({
                label: 'Restart',
                style: ButtonStyle.Secondary,
                customId: buildCustomId({
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
            'User Roles',
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
    const tempData = Globals.tempData.getData({
        messageId: interaction.message.id,
        userId: interaction.user.id,
        channelId: interaction.channelId,
    });
    if (tempData === undefined) {
        const expiredDataEmbed = newEmbed(
            'User Roles',
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
                customId: buildCustomId({
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
    const { rolesToRemove, rolesToAdd } = tempData.savedData;
    const memberRoles =
        interaction.member instanceof GuildMember
            ? interaction.member.roles
            : undefined;
    if (memberRoles === undefined) {
        return log(
            'error',
            'interaction.member did not return GuildMember, what',
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
