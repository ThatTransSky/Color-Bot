import { Role } from 'discord.js';
import { Globals } from '../helpers/globals.js';

export const data = {
    name: 'roleUpdate',
};

export async function execute(oldRole: Role, updatedRole: Role) {
    const storedRole = Globals.Roles.getRole({ id: oldRole.id });
    if (storedRole !== undefined) {
        return Globals.Roles.updateRole(storedRole, updatedRole);
    }
}
