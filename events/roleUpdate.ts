import { Role } from 'discord.js';
import { Constants } from '../helpers/constants.js';

export const data = {
    name: 'roleUpdate',
};

export async function execute(oldRole: Role, updatedRole: Role) {
    const storedRole = Constants.Roles.getRole({ id: oldRole.id });
    if (storedRole !== undefined) {
        return Constants.Roles.updateRole(storedRole, updatedRole);
    }
}
