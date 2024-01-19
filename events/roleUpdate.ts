import { Role } from 'discord.js';
import { Globals } from '../helpers/globals.js';

export const data = {
    name: 'roleUpdate',
};

export async function execute(oldRole: Role, updatedRole: Role) {
    let { roleConfig } = Globals.guildConfigs.guilds.get(oldRole.guild?.id);
    if (roleConfig === undefined) {
        roleConfig = Globals.guildConfigs.guilds.get(
            updatedRole.guild?.id,
        ).roleConfig;
    }
    const storedRole = roleConfig.getRole({ id: oldRole.id });
    if (storedRole !== undefined) {
        return roleConfig.updateRole(storedRole, updatedRole);
    }
}
