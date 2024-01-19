import {
    Client,
    Guild,
    GuildMember,
    Interaction,
    Role,
    User,
} from 'discord.js';
import { Globals } from './globals.js';
import { LocalUtils } from './utils.js';

export function getRoleById(
    client: Client,
    id: string,
    callback: (success: boolean, givenId: string, role?: Role) => void,
) {
    client.guilds.fetch(Globals.GUILD_ID).then((guild) => {
        const role = guild.roles.cache.get(id);
        role !== undefined
            ? callback(true, id, role)
            : guild.roles
                  .fetch(id)
                  .then((role) => {
                      return callback(true, id, role);
                  })
                  .catch(() => {
                      return callback(false, id);
                  });
    });
}
/** DEPRECATED: Please use *getRoleById* instead. */
export async function getRoleByName(
    client: Client,
    name: string,
    callback: (success: boolean, givenName: string, role?: Role) => void,
) {
    LocalUtils.log('warn', 'DEPRECATED: Please use `getRoleById` instead.');
    const findRole = (guild: Guild) => {
        const cachedRole = guild.roles.cache.find(
            (role) => role.name.toLowerCase() === name.toLowerCase(),
        );
        cachedGuild !== undefined
            ? callback(true, name, cachedRole)
            : guild.roles.fetch().then((roles) => {
                  const role = roles.find(
                      (role) => role.name.toLowerCase() === name.toLowerCase(),
                  );
                  role !== undefined
                      ? callback(true, name, role)
                      : callback(false, name);
              });
    };
    let cachedGuild = client.guilds.cache.get(Globals.GUILD_ID);
    if (cachedGuild === undefined) {
        return client.guilds.fetch(Globals.GUILD_ID).then(findRole);
    }
    return findRole(cachedGuild);
}

export async function checkRolesAgainstUser(
    roleIds: string[],
    member: GuildMember,
    callback: (rolesToRemove: Role[], rolesToAdd: Role[]) => void,
) {
    let rolesToRemove: Role[] = [];
    let rolesToAdd: Role[] = [];
    const rolesToCheck = roleIds.map((id) => member.guild.roles.cache.get(id));
    rolesToCheck.forEach((role) => {
        if (member.roles.cache.has(role.id)) rolesToRemove.push(role);
        else rolesToAdd.push(role);
    });
    callback(rolesToRemove, rolesToAdd);
}

export function checkRolesToReplace(
    roleId: string,
    member: GuildMember,
    callback: (roleToReplace: Role | undefined) => void,
) {
    const roleConfig = getRoleConfig(member.guild.id);
    const storedRole = roleConfig.getRole({ id: roleId });
    const type = roleConfig.getType(storedRole.type);
    const roleToReplace = type.roles?.find((role) =>
        member.roles.cache.has(role.id),
    );
    if (roleToReplace?.id === storedRole?.id) {
        return callback(null);
    }
    return callback(
        roleToReplace !== undefined
            ? member.guild.roles.cache.get(roleToReplace.id)
            : undefined,
    );
}

export function getIdentifiers(interaction: Interaction) {
    return {
        messageId:
            !interaction.isCommand() && !interaction.isAutocomplete()
                ? interaction.message.id
                : undefined,
        channelId: interaction.channelId,
        userId: interaction.user.id,
    };
}

export const emptyReply = {
    content: '',
    components: [],
    embeds: [],
};

export function getRoleConfig(guildId: string) {
    return Globals.guildConfigs.guilds.get(guildId)?.roleConfig;
}

export function getBotConfig(guildId: string) {
    return Globals.guildConfigs.guilds.get(guildId)?.botConfig;
}
