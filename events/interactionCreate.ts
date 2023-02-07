import { stripIndent } from 'common-tags';
import {
  ActionRowBuilder,
  APISelectMenuOption,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Interaction,
  Role,
  StringSelectMenuBuilder,
  userMention,
  Collection,
  roleMention,
} from 'discord.js';
import { Client2 } from '../main';

export const name = 'interactionCreate';
export async function execute(interaction: Interaction, client: Client2) {
  try {
    if (interaction.isCommand()) {
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (command === undefined) {
          console.log(
            `The command you tried to execute doesn't exist, how? got ${interaction.commandName}`,
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
    const mainAction = customId.split('|').at(0);
    const secondaryAction = customId.split('|').at(1);
    const stage = customId.split('|').at(2);
    const anythingElse = customId.split('|').slice(3);
    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents([
      new ButtonBuilder()
        .setCustomId(`${mainAction}|exit`)
        .setLabel('Exit')
        .setStyle(ButtonStyle.Danger),
    ]);
    if (interaction.isButton()) {
      if (secondaryAction === 'exit') {
        await interaction.deferUpdate();
        return await interaction.deleteReply();
      }
      if (mainAction === 'roles') {
        if (secondaryAction === 'userRoles') {
          if (stage === 'startMessage') {
            // console.log(anythingElse);
            if (anythingElse.includes('back')) await interaction.deferUpdate();
            else {
              console.log(`${interaction.user.tag} created a new role system interaction`);
              await interaction.deferReply({ ephemeral: true });
            }
            const selectRoleTypeEmbed = new EmbedBuilder()
              .setColor('Random')
              .setTitle('User Roles')
              .setDescription(
                stripIndent`
            Welcome ${userMention(interaction.user.id)}!

            Please select the category of roles you'd like to edit:
            `,
              )
              .setTimestamp()
              .setColor('LuminousVividPink');
            const roleCategoryMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents([
              new StringSelectMenuBuilder()
                .setCustomId(`${mainAction}|${secondaryAction}|selectRoleBasedCategory`)
                .setOptions([
                  {
                    label: 'Age',
                    description: 'Your age group role.',
                    value: 'age',
                  },
                  {
                    label: 'Sexuality',
                    description: 'The role that best describes your sexuality.',
                    value: 'sexuality',
                  },
                  {
                    label: 'Pronouns',
                    description: 'The role(s) that fits your pronouns.',
                    value: 'pronouns',
                  },
                  {
                    label: 'Color Role',
                    description: 'Your color role.',
                    value: 'color',
                  },
                  {
                    label: 'Pings',
                    description: 'When would you rather be pinged or not.',
                    value: 'pings',
                  },
                ])
                .setPlaceholder('Select a category:'),
            ]);
            return await interaction.editReply({
              content: '',
              embeds: [selectRoleTypeEmbed],
              components: [roleCategoryMenu, buttonRow],
            });
          } else if (stage === 'selectRoleBasedCategory') {
            buttonRow.setComponents([
              new ButtonBuilder()
                .setCustomId(`${mainAction}|${secondaryAction}|startMessage|back`)
                .setLabel('Back')
                .setStyle(ButtonStyle.Secondary),
              buttonRow.components[0],
            ]);
            await interaction.deferUpdate();
            const selectedRoleType = anythingElse[0];
            const selectRolesBasedOnType = new EmbedBuilder()
              .setColor('Random')
              .setTitle(
                selectedRoleType.replace(
                  selectedRoleType.charAt(0),
                  selectedRoleType.charAt(0).toUpperCase(),
                ),
              ).setDescription(stripIndent`
            You have selected ${selectedRoleType.replace(
              selectedRoleType.charAt(0),
              selectedRoleType.charAt(0).toUpperCase(),
            )}!

            Use the menu below to select the role${(() => {
              if (selectedRoleType === 'pronouns' || selectedRoleType === 'pings') return 's';
              else return '';
            })()} you would like to add / remove:
            ${(() => {
              if (selectedRoleType === 'pronouns' || selectedRoleType === 'pings')
                return '(*In this category, you can select multiple roles. When you are done selecting, click out of the menu to finalize your decision.*)';
              else return '';
            })()}
            `);
            const selectRoleMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents([
              new StringSelectMenuBuilder().setCustomId(
                `${mainAction}|${secondaryAction}|selectedRoles|${selectedRoleType}`,
              ),
            ]);
            if (selectedRoleType === 'age') {
              selectRoleMenu.components[0]
                .setOptions([
                  {
                    label: '18+',
                    description: 'You are over the age of 18.',
                    value: 'boomer',
                  },
                  {
                    label: 'Minor',
                    description: `You are below the age of 18. (but over 13, @discord relax)`,
                    value: 'minor',
                  },
                ])
                .setPlaceholder('Select One Role.');
            } else if (selectedRoleType === 'sexuality') {
              selectRoleMenu.components[0]
                .addOptions([
                  {
                    label: 'I love woman.',
                    value: 'woman lover',
                  },
                  {
                    label: 'I love man.',
                    value: 'man lover',
                  },
                  {
                    label: 'I love all genders.',
                    value: 'any lover',
                  },
                  {
                    label: `I don't do romance.`,
                    value: 'garlic bread lover',
                  },
                  {
                    label: `I don't know / would rather not say.`,
                    value: 'unknown lover',
                  },
                ])
                .setPlaceholder('Select One Role.');
            } else if (selectedRoleType === 'pronouns') {
              selectRoleMenu.components[0]
                .addOptions([
                  {
                    label: 'He/Him',
                    value: 'he/him',
                  },
                  {
                    label: 'She/Her',
                    value: 'she/her',
                  },
                  {
                    label: 'They/Them',
                    value: 'they/them',
                  },
                  {
                    label: 'Any',
                    value: 'any pronouns',
                  },
                  {
                    label: 'Other/Ask',
                    value: 'ask me for pronouns',
                  },
                ])
                .setMinValues(1)
                .setMaxValues(5)
                .setPlaceholder('Select Roles.');
            } else if (selectedRoleType === 'color') {
              const colorOptions: APISelectMenuOption[] = [];
              const colors = [
                // 'Dark Red',
                'Light Neon Red',
                'Orange',
                'Yellow',
                // 'Gold',
                'Green',
                'Dark Green',
                'Teal',
                // 'Light Blue',
                'Blue',
                // 'Dark Purple',
                'Purple',
                'Magenta',
                'Light Pink',
                // 'Rose',
                'Hot Pink',
                'Black',
                'White',
              ];
              colors.forEach((color) =>
                colorOptions.push({
                  label: color,
                  value: color.toLowerCase(),
                }),
              );
              selectRoleMenu.components[0]
                .addOptions(colorOptions)
                .setPlaceholder('Select a Color');
            } else if (selectedRoleType === 'pings') {
              selectRoleMenu.components[0]
                .addOptions([
                  {
                    label: 'All Pings',
                    description: 'You will be pinged whenever any activity / announcement is made.',
                    value: 'all pings',
                  },
                  {
                    label: 'SMP Pings',
                    description:
                      'You will be pinged whenever any SMP-Related activity / announcement is made.',
                    value: 'smp member',
                  },
                  // {
                  //   label: 'Game Pings',
                  //   description:
                  //     'You will be pinged whenever someone is looking for someone to play with.',
                  //   value: 'game pings',
                  // },
                  {
                    label: 'Poll Pings',
                    description: `You will be pinged whenever there's a poll running.`,
                    value: 'poll pings',
                  },
                  {
                    label: 'Announcement Pings',
                    description: 'You will be pinged whenever a non-specific announcement is made.',
                    value: 'announcement pings',
                  },
                  {
                    label: 'VC Pings',
                    description:
                      'You will be pinged whenever a member is looking for someone to VC with.',
                    value: 'vc pings',
                  },
                ])
                .setMinValues(1)
                .setMaxValues(5);
            } else {
              console.log('how what');
            }
            return await interaction.editReply({
              content: '',
              embeds: [selectRolesBasedOnType],
              components: [selectRoleMenu, buttonRow],
            });
          } else if (stage === 'removeRole') {
            if (!interaction.inCachedGuild()) return;
            await interaction.deferUpdate();
            const memberRoles = interaction.member.roles;
            const fetchedRoles = await interaction.guild.roles.fetch();
            const roleToRemove = fetchedRoles.get(anythingElse[0]);
            try {
              await memberRoles.remove(roleToRemove);
              let roleType: string = '';
              const colors = [
                // 'Dark Red',
                'Light Neon Red',
                'Orange',
                'Yellow',
                // 'Gold',
                'Green',
                'Dark Green',
                'Teal',
                // 'Light Blue',
                'Blue',
                // 'Dark Purple',
                'Purple',
                'Magenta',
                'Light Pink',
                // 'Rose',
                'Hot Pink',
                'Black',
                'White',
              ];
              if (['minor', 'boomer'].includes(roleToRemove.name.toLowerCase())) {
                roleType = 'age';
              } else if (
                [
                  'woman lover',
                  'man lover',
                  'garlic bread lover',
                  'any lover',
                  'unknown lover',
                ].includes(roleToRemove.name.toLowerCase())
              ) {
                roleType = 'sexuality';
              } else if (
                ['he/him', 'she/her', 'they/them', 'any pronouns', 'ask me for pronouns'].includes(
                  roleToRemove.name.toLowerCase(),
                )
              ) {
                roleType = 'pronouns';
              } else if (colors.includes(roleToRemove.name.toLowerCase())) {
                roleType = 'color';
              } else if (
                [
                  'all pings',
                  'smp member',
                  'poll pings',
                  'announcement pings',
                  'vc pings',
                ].includes(roleToRemove.name.toLowerCase())
              ) {
                roleType = 'pings';
              } else {
                console.log(
                  `the role to remove didn't match any type???? got ${roleToRemove.name.toLowerCase()}`,
                );
              }
              const roleRemovedEmbed = new EmbedBuilder()
                .setColor('Random')
                .setTitle('Roles Removed')
                .setDescription(
                  stripIndent`
                Successfully removed ${roleMention(roleToRemove.id)}!
                `,
                )
                .setTimestamp();
              buttonRow.setComponents([
                new ButtonBuilder()
                  .setCustomId(
                    `${mainAction}|${secondaryAction}|selectRoleBasedCategory|${roleType}`,
                  )
                  .setLabel('Back to Role Selection')
                  .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                  .setCustomId(`${mainAction}|${secondaryAction}|startMessage|back`)
                  .setLabel('Back to Category Selection')
                  .setStyle(ButtonStyle.Secondary),
                buttonRow.components[0],
              ]);
              return await interaction.editReply({
                content: '',
                embeds: [roleRemovedEmbed],
                components: [buttonRow],
              });
            } catch (err) {
              return console.error(err);
            }
          } else if (stage === 'removeRoles') {
            if (!interaction.inCachedGuild()) return;
            await interaction.deferUpdate();
            const memberRoles = interaction.member.roles;
            const fetchedRoles = await interaction.guild.roles.fetch();
            const roleNames = anythingElse[0].trim().split(',');
            // console.log(roleNames);
            const rolesToRemove = fetchedRoles.filter((role) => roleNames.includes(role.name));
            try {
              await memberRoles.remove(rolesToRemove);
              let roleType: string = '';
              const colors = [
                // 'Dark Red',
                'Light Neon Red',
                'Orange',
                'Yellow',
                // 'Gold',
                'Green',
                'Dark Green',
                'Teal',
                // 'Light Blue',
                'Blue',
                // 'Dark Purple',
                'Purple',
                'Magenta',
                'Light Pink',
                // 'Rose',
                'Hot Pink',
                'Black',
                'White',
              ];
              if (['minor', 'boomer'].includes(rolesToRemove.first().name.toLowerCase())) {
                roleType = 'age';
              } else if (
                [
                  'woman lover',
                  'man lover',
                  'garlic bread lover',
                  'any lover',
                  'unknown lover',
                ].includes(rolesToRemove.first().name.toLowerCase())
              ) {
                roleType = 'sexuality';
              } else if (
                ['he/him', 'she/her', 'they/them', 'any pronouns', 'ask me for pronouns'].includes(
                  rolesToRemove.first().name.toLowerCase(),
                )
              ) {
                roleType = 'pronouns';
              } else if (colors.includes(rolesToRemove.first().name.toLowerCase())) {
                roleType = 'color';
              } else if (
                [
                  'all pings',
                  'smp member',
                  'poll pings',
                  'announcement pings',
                  'vc pings',
                ].includes(rolesToRemove.first().name.toLowerCase())
              ) {
                roleType = 'pings';
              } else {
                console.log(
                  `the role to remove didn't match any type???? got ${rolesToRemove
                    .first()
                    .name.toLowerCase()}`,
                );
              }
              buttonRow.setComponents([
                new ButtonBuilder()
                  .setCustomId(
                    `${mainAction}|${secondaryAction}|selectRoleBasedCategory|${roleType}`,
                  )
                  .setLabel('Back to Role Selection')
                  .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                  .setCustomId(`${mainAction}|${secondaryAction}|startMessage|back`)
                  .setLabel('Back to Category Selection')
                  .setStyle(ButtonStyle.Secondary),
                buttonRow.components[0],
              ]);
              const mentionRoles: string[] = [];
              rolesToRemove.forEach((role) => {
                mentionRoles.push(roleMention(role.id));
              });
              const rolesRemovedEmbed = new EmbedBuilder()
                .setColor('Random')
                .setTitle('Roles Removed')
                .setDescription(
                  stripIndent`
                Successfully removed ${mentionRoles}!
                `,
                )
                .setTimestamp();
              return await interaction.editReply({
                content: '',
                embeds: [rolesRemovedEmbed],
                components: [buttonRow],
              });
            } catch (err) {
              return console.error(err);
            }
          } else if (stage === 'updateRoles') {
            if (!interaction.inCachedGuild()) return;
            await interaction.deferUpdate();
            const roleNames = anythingElse[0].trim().split(',');
            const memberRoles = interaction.member.roles;
            const fetchedRoles = await interaction.guild.roles.fetch();
            const rolesToCheck = fetchedRoles.filter((role) => roleNames.includes(role.name));
            const rolesToRemove = rolesToCheck.filter((role) => memberRoles.cache.has(role.id));
            const rolesToAdd = rolesToCheck.filter((role) => !memberRoles.cache.has(role.id));
            try {
              await memberRoles.add(rolesToAdd);
              await memberRoles.remove(rolesToRemove);
            } catch (err) {
              return console.error(err);
            }
            const mentionAddedRoles: string[] = [];
            const mentionRemovedRoles: string[] = [];
            rolesToAdd.forEach((role) => {
              mentionAddedRoles.push(roleMention(role.id));
            });
            rolesToRemove.forEach((role) => {
              mentionRemovedRoles.push(roleMention(role.id));
            });
            const updatedRolesEmbed = new EmbedBuilder()
              .setColor('Random')
              .setTitle('Updated Roles!')
              .setDescription(
                stripIndent`
              Successfully updated your roles! See below the changes that were made:
              
              `,
              )
              .addFields([
                { name: 'Added Roles', value: `${mentionAddedRoles}`, inline: true },
                { name: 'Removed Roles', value: `${mentionRemovedRoles}`, inline: true },
              ]);
            let roleType: string = '';
            const colors = [
              // 'Dark Red',
              'Light Neon Red',
              'Orange',
              'Yellow',
              // 'Gold',
              'Green',
              'Dark Green',
              'Teal',
              // 'Light Blue',
              'Blue',
              // 'Dark Purple',
              'Purple',
              'Magenta',
              'Light Pink',
              // 'Rose',
              'Hot Pink',
              'Black',
              'White',
            ];
            if (['minor', 'boomer'].includes(rolesToCheck.first().name.toLowerCase())) {
              roleType = 'age';
            } else if (
              [
                'woman lover',
                'man lover',
                'garlic bread lover',
                'any lover',
                'unknown lover',
              ].includes(rolesToCheck.first().name.toLowerCase())
            ) {
              roleType = 'sexuality';
            } else if (
              ['he/him', 'she/her', 'they/them', 'any pronouns', 'ask me for pronouns'].includes(
                rolesToCheck.first().name.toLowerCase(),
              )
            ) {
              roleType = 'pronouns';
            } else if (colors.includes(rolesToCheck.first().name.toLowerCase())) {
              roleType = 'color';
            } else if (
              ['all pings', 'smp member', 'poll pings', 'announcement pings', 'vc pings'].includes(
                rolesToCheck.first().name.toLowerCase(),
              )
            ) {
              roleType = 'pings';
            } else {
              console.log(
                `the role to remove didn't match any type???? got ${rolesToCheck
                  .first()
                  .name.toLowerCase()}`,
              );
            }
            buttonRow.setComponents([
              new ButtonBuilder()
                .setCustomId(`${mainAction}|${secondaryAction}|selectRoleBasedCategory|${roleType}`)
                .setLabel('Back to Role Selection')
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`${mainAction}|${secondaryAction}|startMessage|back`)
                .setLabel('Back to Category Selection')
                .setStyle(ButtonStyle.Secondary),
              buttonRow.components[0],
            ]);
            return await interaction.editReply({
              content: '',
              embeds: [updatedRolesEmbed],
              components: [buttonRow],
            });
          } else if (stage === 'onlyAddRoles') {
            if (!interaction.inCachedGuild()) return;
            await interaction.deferUpdate();
            const roleNames = anythingElse[0].trim().split(',');
            const memberRoles = interaction.member.roles;
            const fetchedRoles = await interaction.guild.roles.fetch();
            const rolesToAdd = fetchedRoles.filter((role) => roleNames.includes(role.name));
            try {
              await memberRoles.add(rolesToAdd);
            } catch (err) {
              return console.error(err);
            }
            let roleType: string = '';
            const colors = [
              // 'Dark Red',
              'Light Neon Red',
              'Orange',
              'Yellow',
              // 'Gold',
              'Green',
              'Dark Green',
              'Teal',
              // 'Light Blue',
              'Blue',
              // 'Dark Purple',
              'Purple',
              'Magenta',
              'Light Pink',
              // 'Rose',
              'Hot Pink',
              'Black',
              'White',
            ];
            if (['minor', 'boomer'].includes(rolesToAdd.first().name.toLowerCase())) {
              roleType = 'age';
            } else if (
              [
                'woman lover',
                'man lover',
                'garlic bread lover',
                'any lover',
                'unknown lover',
              ].includes(rolesToAdd.first().name.toLowerCase())
            ) {
              roleType = 'sexuality';
            } else if (
              ['he/him', 'she/her', 'they/them', 'any pronouns', 'ask me for pronouns'].includes(
                rolesToAdd.first().name.toLowerCase(),
              )
            ) {
              roleType = 'pronouns';
            } else if (colors.includes(rolesToAdd.first().name.toLowerCase())) {
              roleType = 'color';
            } else if (
              ['all pings', 'smp member', 'poll pings', 'announcement pings', 'vc pings'].includes(
                rolesToAdd.first().name.toLowerCase(),
              )
            ) {
              roleType = 'pings';
            } else {
              console.log(
                `the role to remove didn't match any type???? got ${rolesToAdd
                  .first()
                  .name.toLowerCase()}`,
              );
            }
            buttonRow.setComponents([
              new ButtonBuilder()
                .setCustomId(`${mainAction}|${secondaryAction}|selectRoleBasedCategory|${roleType}`)
                .setLabel('Back to Role Selection')
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`${mainAction}|${secondaryAction}|startMessage|back`)
                .setLabel('Back to Category Selection')
                .setStyle(ButtonStyle.Secondary),
              buttonRow.components[0],
            ]);
            const rolesAddedEmbed = new EmbedBuilder()
              .setColor('Random')
              .setTitle('Added Roles')
              .setTimestamp();
            if (rolesToAdd.size === 1) {
              rolesAddedEmbed.setDescription(
                stripIndent`
                      The role ${roleMention(rolesToAdd.firstKey())} was successfully added!
                      `,
              );
            } else {
              const mentionRoles: string[] = [];
              rolesToAdd.forEach((role) => {
                mentionRoles.push(roleMention(role.id));
              });
              rolesAddedEmbed.setDescription(stripIndent`
                  The roles ${mentionRoles} were successfully added!
                  `);
            }
            return await interaction.editReply({
              content: '',
              embeds: [rolesAddedEmbed],
              components: [buttonRow],
            });
          }
        }
      }
    } else if (interaction.isAnySelectMenu()) {
      if (interaction.isStringSelectMenu()) {
        if (mainAction === 'roles') {
          if (secondaryAction === 'userRoles') {
            if (stage === 'selectRoleBasedCategory') {
              buttonRow.setComponents([
                new ButtonBuilder()
                  .setCustomId(`${mainAction}|${secondaryAction}|startMessage|back`)
                  .setLabel('Back')
                  .setStyle(ButtonStyle.Secondary),
                buttonRow.components[0],
              ]);
              await interaction.deferUpdate();
              const { values } = interaction;
              const selectedRoleType = values[0];
              const selectRolesBasedOnType = new EmbedBuilder()
                .setColor('Random')
                .setTitle(
                  selectedRoleType.replace(
                    selectedRoleType.charAt(0),
                    selectedRoleType.charAt(0).toUpperCase(),
                  ),
                ).setDescription(stripIndent`
            You have selected ${selectedRoleType.replace(
              selectedRoleType.charAt(0),
              selectedRoleType.charAt(0).toUpperCase(),
            )}!

            Use the menu below to select the role${(() => {
              if (selectedRoleType === 'pronouns' || selectedRoleType === 'pings') return 's';
              else return '';
            })()} you would like to add / remove:
            ${(() => {
              if (selectedRoleType === 'pronouns' || selectedRoleType === 'pings')
                return '(*In this category, you can select multiple roles. When you are done selecting, click out of the menu to finalize your decision.*)';
              else return '';
            })()}
            `);
              const selectRoleMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents([
                new StringSelectMenuBuilder().setCustomId(
                  `${mainAction}|${secondaryAction}|selectedRoles|${selectedRoleType}`,
                ),
              ]);
              if (selectedRoleType === 'age') {
                selectRoleMenu.components[0]
                  .setOptions([
                    {
                      label: '18+',
                      description: 'You are over the age of 18.',
                      value: 'boomer',
                    },
                    {
                      label: 'Minor',
                      description: `You are below the age of 18. (but over 13, @discord relax)`,
                      value: 'minor',
                    },
                  ])
                  .setPlaceholder('Select One Role.');
              } else if (selectedRoleType === 'sexuality') {
                selectRoleMenu.components[0]
                  .addOptions([
                    {
                      label: 'I love woman.',
                      value: 'woman lover',
                    },
                    {
                      label: 'I love man.',
                      value: 'man lover',
                    },
                    {
                      label: 'I love all genders.',
                      value: 'any lover',
                    },
                    {
                      label: `I don't do romance.`,
                      value: 'garlic bread lover',
                    },
                    {
                      label: `I don't know / would rather not say.`,
                      value: 'unknown lover',
                    },
                  ])
                  .setPlaceholder('Select One Role.');
              } else if (selectedRoleType === 'pronouns') {
                selectRoleMenu.components[0]
                  .addOptions([
                    {
                      label: 'He/Him',
                      value: 'he/him',
                    },
                    {
                      label: 'She/Her',
                      value: 'she/her',
                    },
                    {
                      label: 'They/Them',
                      value: 'they/them',
                    },
                    {
                      label: 'Any',
                      value: 'any pronouns',
                    },
                    {
                      label: 'Other/Ask',
                      value: 'ask me for pronouns',
                    },
                  ])
                  .setMinValues(1)
                  .setMaxValues(5)
                  .setPlaceholder('Select Roles.');
              } else if (selectedRoleType === 'color') {
                const colorOptions: APISelectMenuOption[] = [];
                const colors = [
                  // 'Dark Red',
                  'Light Neon Red',
                  'Orange',
                  'Yellow',
                  // 'Gold',
                  'Green',
                  'Dark Green',
                  'Teal',
                  // 'Light Blue',
                  'Blue',
                  // 'Dark Purple',
                  'Purple',
                  'Magenta',
                  'Light Pink',
                  // 'Rose',
                  'Hot Pink',
                  'Black',
                  'White',
                ];
                colors.forEach((color) =>
                  colorOptions.push({
                    label: color,
                    value: color.toLowerCase(),
                  }),
                );
                selectRoleMenu.components[0]
                  .addOptions(colorOptions)
                  .setPlaceholder('Select a Color');
              } else if (selectedRoleType === 'pings') {
                selectRoleMenu.components[0]
                  .addOptions([
                    {
                      label: 'All Pings',
                      description:
                        'You will be pinged whenever any activity / announcement is made.',
                      value: 'all pings',
                    },
                    {
                      label: 'SMP Pings',
                      description:
                        'You will be pinged whenever any SMP-Related activity / announcement is made.',
                      value: 'smp member',
                    },
                    // {
                    //   label: 'Game Pings',
                    //   description:
                    //     'You will be pinged whenever someone is looking for someone to play with.',
                    //   value: 'game pings',
                    // },
                    {
                      label: 'Poll Pings',
                      description: `You will be pinged whenever there's a poll running.`,
                      value: 'poll pings',
                    },
                    {
                      label: 'Announcement Pings',
                      description:
                        'You will be pinged whenever a non-specific announcement is made.',
                      value: 'announcement pings',
                    },
                    {
                      label: 'VC Pings',
                      description:
                        'You will be pinged whenever a member is looking for someone to VC with.',
                      value: 'vc pings',
                    },
                  ])
                  .setMinValues(1)
                  .setMaxValues(5);
              } else {
                console.log('how what');
              }
              return await interaction.editReply({
                embeds: [selectRolesBasedOnType],
                components: [selectRoleMenu, buttonRow],
              });
            } else if (stage === 'selectedRoles') {
              await interaction.deferUpdate();
              const selectedRoleType = anythingElse[0];
              const selectedRoles = interaction.values;
              if (selectedRoles.length === 0) return console.log('no roles wtf?');
              if (!interaction.inCachedGuild()) return;
              const memberRoles = interaction.member.roles;
              let fetchedRoles = await interaction.guild.roles.fetch();
              let rolesMarkedForRemoval = new Collection<string, Role>();
              let rolesMarkedForAddition = new Collection<string, Role>();
              let rolesReplaced = new Collection<string, Role>();
              if (selectedRoleType === 'age') {
                const rolesToCheck = fetchedRoles.filter((role) =>
                  ['minor', 'boomer'].includes(role.name.toLowerCase()),
                );
                rolesToCheck.forEach(async (role) => {
                  if (memberRoles.cache.has(role.id)) {
                    rolesReplaced.set(role.id, role);
                  }
                });
              } else if (selectedRoleType === 'sexuality') {
                const rolesToCheck = fetchedRoles.filter((role) =>
                  [
                    'woman lover',
                    'man lover',
                    'garlic bread lover',
                    'any lover',
                    'unknown lover',
                  ].includes(role.name.toLowerCase()),
                );
                rolesToCheck.forEach((role) => {
                  if (memberRoles.cache.has(role.id)) {
                    rolesReplaced.set(role.id, role);
                  }
                });
              } else if (selectedRoleType === 'color') {
                const colors = [
                  'Light Neon Red',
                  'Orange',
                  'Yellow',
                  'Green',
                  'Dark Green',
                  'Teal',
                  'Blue',
                  // 'Dark Purple',
                  'Purple',
                  'Magenta',
                  'Light Pink',
                  'Hot Pink',
                  'Black',
                  'White',
                ];
                colors.forEach((color, index) => {
                  colors[index] = color.toLowerCase();
                });
                // console.log(colors);
                const rolesToCheck = fetchedRoles.filter((role) =>
                  colors.includes(role.name.toLowerCase()),
                );
                rolesToCheck.forEach(async (role) => {
                  if (memberRoles.cache.has(role.id)) {
                    rolesReplaced.set(role.id, role);
                  }
                });
              }
              const filteredRoles = fetchedRoles.filter((role) =>
                selectedRoles.includes(role.name.toLowerCase()),
              );
              if (selectedRoles.length !== filteredRoles.size) {
                let difference: string[] = [];
                (() => {
                  selectedRoles.forEach((selectedRoleName) => {
                    let found: boolean = false;
                    filteredRoles.forEach((fetchedRole) => {
                      if (selectedRoleName === fetchedRole.name.toLowerCase()) found = true;
                    });
                    if (!found) {
                      console.log(`${selectedRoleName} was not found within the server's roles.`);
                      difference.push(selectedRoleName);
                    }
                  });
                })();
                if (difference.length > 0) {
                  return await interaction.editReply({
                    content: stripIndent`
                        The roles that you have selected do not exist, which is not supposed to happen.
                        Please let my creator (${userMention(
                          process.env.CREATOR_ID,
                        )}) know of this error!
                        The roles that caused the error are the following: ${difference}.
                        `,
                    components: [buttonRow],
                    embeds: [],
                  });
                }
              }
              let diffMessage = '```diff\n';
              /* The Creation of the difference message */
              filteredRoles.forEach((role) => {
                if (memberRoles.cache.has(role.id)) {
                  console.log(
                    `${interaction.user.tag} already has the role ${role.name}, marking for removal...`,
                  );
                  diffMessage += `- Removing: ${role.name}\n`;
                  rolesMarkedForRemoval.set(role.id, role);
                } else {
                  console.log(
                    `${interaction.user.tag} does not have the role ${role.name}, marking for addition...`,
                  );
                  diffMessage += `+ Adding: ${role.name}\n`;
                  rolesMarkedForAddition.set(role.id, role);
                }
              });
              diffMessage += '```';
              /* Only Additions */
              if (rolesMarkedForRemoval.size === 0 && rolesMarkedForAddition.size !== 0) {
                buttonRow.setComponents([
                  new ButtonBuilder()
                    .setCustomId(
                      `${mainAction}|${secondaryAction}|selectRoleBasedCategory|${anythingElse[0]}`,
                    )
                    .setLabel('Back to Role Selection')
                    .setStyle(ButtonStyle.Secondary),
                  new ButtonBuilder()
                    .setCustomId(`${mainAction}|${secondaryAction}|startMessage|back`)
                    .setLabel('Back to Category Selection')
                    .setStyle(ButtonStyle.Secondary),
                  buttonRow.components[0],
                ]);
                const rolesAddedEmbed = new EmbedBuilder()
                  .setColor('Random')
                  .setTitle('Added Roles')
                  .setTimestamp();
                try {
                  await memberRoles.add(rolesMarkedForAddition, 'Roles were selected by the user.');
                } catch (err) {
                  console.error(err);
                }
                if (rolesMarkedForAddition.size === 1) {
                  rolesAddedEmbed.setDescription(
                    stripIndent`
                      The role ${roleMention(
                        rolesMarkedForAddition.firstKey(),
                      )} was successfully added!
                      `,
                  );
                  if (rolesReplaced.size > 0) {
                    try {
                      await memberRoles.remove(rolesReplaced);
                      if (rolesReplaced.size === 1) {
                        rolesAddedEmbed.setDescription(stripIndent`
                        The role ${roleMention(
                          rolesReplaced.firstKey(),
                        )} was replaced with ${roleMention(
                          rolesMarkedForAddition.firstKey(),
                        )} successfully!
                      `);
                      } else {
                        return console.log('more than one replaced role??????');
                      }
                    } catch (err) {
                      return console.error(err);
                    }
                  }
                } else {
                  const mentionRoles: string[] = [];
                  rolesMarkedForAddition.forEach((role) => {
                    mentionRoles.push(roleMention(role.id));
                  });
                  try {
                    await memberRoles.add(rolesMarkedForAddition);
                  } catch (err) {
                    console.error(err);
                  }
                  rolesAddedEmbed.setDescription(stripIndent`
                  The roles ${mentionRoles} were successfully added!
                  `);
                }
                return await interaction.editReply({
                  content: '',
                  embeds: [rolesAddedEmbed],
                  components: [buttonRow],
                });
              }
              /* Only Removals */
              if (rolesMarkedForAddition.size === 0 && rolesMarkedForRemoval.size !== 0) {
                const removeRolesEmbed = new EmbedBuilder()
                  .setColor('Random')
                  .setTitle('Remove Roles?')
                  .setTimestamp();
                if (rolesMarkedForRemoval.size === 1) {
                  removeRolesEmbed.setDescription(stripIndent`
                  You have selected the role ${roleMention(
                    rolesMarkedForRemoval.firstKey(),
                  )}, which you already have.
                  Would you like to remove it?
                  `);
                  buttonRow.setComponents([
                    new ButtonBuilder()
                      .setCustomId(
                        `${mainAction}|${secondaryAction}|removeRole|${rolesMarkedForRemoval.firstKey()}`,
                      )
                      .setLabel('Remove Role!')
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(
                        `${mainAction}|${secondaryAction}|selectRoleBasedCategory|${anythingElse[0]}`,
                      )
                      .setLabel('Change Selection')
                      .setStyle(ButtonStyle.Secondary),
                    buttonRow.components[0],
                  ]);
                  return await interaction.editReply({
                    content: '',
                    embeds: [removeRolesEmbed],
                    components: [buttonRow],
                  });
                } else if (rolesMarkedForRemoval.size > 1) {
                  let mentionRoles: string[] = [];
                  let roleNames: string[] = [];
                  rolesMarkedForRemoval.forEach((role) => {
                    roleNames.push(role.name);
                    mentionRoles.push(roleMention(role.id));
                  });
                  removeRolesEmbed.setDescription(stripIndent`
                  You have selected the roles ${mentionRoles}, which you already have.
                  Would you like to remove them?
                  `);
                  buttonRow.setComponents([
                    new ButtonBuilder()
                      .setCustomId(`${mainAction}|${secondaryAction}|removeRoles|${roleNames}`)
                      .setLabel('Remove Roles!')
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(
                        `${mainAction}|${secondaryAction}|selectRoleBasedCategory|${anythingElse[0]}`,
                      )
                      .setLabel('Change Selection')
                      .setStyle(ButtonStyle.Secondary),
                    buttonRow.components[0],
                  ]);
                  return await interaction.editReply({
                    content: '',
                    embeds: [removeRolesEmbed],
                    components: [buttonRow],
                  });
                }
              }
              /* Additions AND Removals */
              if (rolesMarkedForAddition.size !== 0 && rolesMarkedForRemoval.size !== 0) {
                const differenceEmbed = new EmbedBuilder()
                  .setColor('Random')
                  .setTitle('Difference in Roles').setDescription(stripIndent`
                  One (or more) roles that you have selected are ones you already have, while others you don't.

                  You can see the difference in roles below:
                  ${diffMessage}

                  Would you like to apply the difference (adding and removing the roles) or only add the roles you don't have?
                  `);
                const roleNamesToAdd: string[] = [];
                const roleNamesToRemove: string[] = [];
                rolesMarkedForAddition.forEach((role) => {
                  roleNamesToAdd.push(role.name);
                });
                rolesMarkedForRemoval.forEach((role) => {
                  roleNamesToRemove.push(role.name);
                });
                buttonRow.setComponents([
                  new ButtonBuilder()
                    .setCustomId(
                      stripIndent`${mainAction}|${secondaryAction}|updateRoles|${roleNamesToAdd.concat(
                        roleNamesToRemove,
                      )}`,
                    )
                    .setLabel('Apply Difference')
                    .setStyle(ButtonStyle.Success),
                  new ButtonBuilder()
                    .setCustomId(`${mainAction}|${secondaryAction}|onlyAddRoles|${roleNamesToAdd}`)
                    .setLabel('Only Add Roles')
                    .setStyle(ButtonStyle.Primary),
                  new ButtonBuilder()
                    .setCustomId(
                      `${mainAction}|${secondaryAction}|selectRoleBasedCategory|${anythingElse[0]}`,
                    )
                    .setLabel('Change Selection')
                    .setStyle(ButtonStyle.Secondary),
                  buttonRow.components[0],
                ]);
                return await interaction.editReply({
                  content: '',
                  embeds: [differenceEmbed],
                  components: [buttonRow],
                });
              }
              /* No Additions and No Removals????? */
              if (rolesMarkedForAddition.size === 0 && rolesMarkedForRemoval.size === 0) {
                console.log('WHAT HOW. no addition AND no removals wth');
                return await interaction.update({
                  content: '(The bot encountered an error, please try again later <3)',
                });
              }
            }
          }
        }
      }
    } else {
      console.log(`Unhandled interaction type, got ${interaction.type}`);
    }
  } catch (err) {
    console.error(err);
  }
}
