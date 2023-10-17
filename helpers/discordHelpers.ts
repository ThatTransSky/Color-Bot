import { Client, Guild, Role } from 'discord.js';
import { Constants } from './constants.js';

export function getRoleById(
    client: Client,
    id: string,
    callback: (success: boolean, givenId: string, role?: Role) => void,
) {
    client.guilds.fetch(Constants.GUILD_ID).then((guild) => {
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

export async function getRoleByName(
    client: Client,
    name: string,
    callback: (success: boolean, givenName: string, role?: Role) => void,
) {
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
    let cachedGuild = client.guilds.cache.get(Constants.GUILD_ID);
    if (cachedGuild === undefined) {
        return client.guilds.fetch(Constants.GUILD_ID).then(findRole);
    }
    return findRole(cachedGuild);
}
