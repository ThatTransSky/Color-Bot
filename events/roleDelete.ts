import { Role } from 'discord.js';
import { Globals } from '../helpers/globals.js';

export const data = {
    name: 'roleDelete',
};

export async function execute(deletedRole: Role) {
    const storedRole = Globals.Roles.getRole({ id: deletedRole.id });
    if (storedRole !== undefined) {
        return Globals.Roles.removeRole(storedRole);
    }
}
