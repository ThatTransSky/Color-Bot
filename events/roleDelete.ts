import { Role } from 'discord.js';
import { Globals } from '../helpers/globals.js';

export const data = {
    name: 'roleDelete',
};

export async function execute(deletedRole: Role) {
    const { roleConfig } = Globals.guildConfigs.guilds.get(
        deletedRole.guild.id,
    );
    const storedRole = roleConfig.getRole({ id: deletedRole.id });
    if (storedRole !== undefined) {
        return roleConfig.removeRole(storedRole);
    }
}
