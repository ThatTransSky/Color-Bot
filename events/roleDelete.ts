import { Role } from 'discord.js';
import { Constants } from '../helpers/constants.js';

export const data = {
    name: 'roleDelete',
};

export async function execute(deletedRole: Role) {
    const storedRole = Constants.Roles.getRole({ id: deletedRole.id });
    if (storedRole !== undefined) {
        return Constants.Roles.removeRole(storedRole);
    }
}
