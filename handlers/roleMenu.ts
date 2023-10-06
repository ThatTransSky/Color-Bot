import { Constants } from '../helpers/constants.js';

export async function mainRoleMenu() {}

export function setOptionsBasedOnType(roleType: string): {
    label: string;
    description?: string;
    value: string;
}[] {
    switch (roleType) {
        case 'color':
            return Constants.convertColorIntoOptions();
        case 'age':
            return Constants.ageRoles;
        case 'sexuality':
            return Constants.sexualityRoles;
        case 'pronouns':
            return Constants.pronounRoles;
        case 'pings':
            return Constants.pingRoles;
        default:
            throw new Error(
                `setOptionsBasedOnType - ${roleType} doesn't exist`,
            );
    }
}
