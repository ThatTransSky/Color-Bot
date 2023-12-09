import { stripIndent } from 'common-tags';
import { jsonParse, jsonString, log, uppercaseWord } from '../helpers/utils.js';
import { readFileSync, writeFile } from 'fs';
import { Client, Role } from 'discord.js';
import { EventEmitter } from 'events';
import { getRoleById, getRoleByName } from '../helpers/discordHelpers.js';
import { newEmbed } from '../helpers/componentBuilders.js';

interface RoleOptions {
    value: string;
    description?: string;
    label: string;
}
interface StoredRole extends RoleOptions {
    type: string;
    id?: string;
}
interface RoleType {
    value: string;
    description?: string;
    label: string;
}
interface StoredType extends RoleType {
    multiRoleType?: boolean;
    roles?: StoredRole[];
}

export class RoleConstants {
    public multiRoleTypeNames: string[];
    public types: StoredType[];
    constructor() {
        try {
            const data = readFileSync('localData/role_config.json', 'utf8');
            this.types = jsonParse<any>(data).roleTypes;
            this.multiRoleTypeNames = this.types.map((type) => {
                if (type.multiRoleType) return type.value;
            });
            return;
        } catch (err) {
            this.types = [];
            this.multiRoleTypeNames = [];
            this.updateFile();
        }
    }

    public selectRolesEmbed = (roleType: string) =>
        newEmbed(
            'User Roles',
            stripIndent`
    You have selected ${uppercaseWord(roleType)}!

    Use the menu below to select the role(s) you would like to add / remove:
    ${(() => {
        if (this.multiRoleTypeNames.includes(roleType.toLowerCase())) {
            return '(*In this category, you can select multiple roles. When you are done selecting, click out of the menu to finalize your decision.*)';
        } else return '';
    })()}`,
            true,
            'Random',
        );

    public getType(typeName: string): StoredType {
        return this.types.find(
            (type) => type.value.toLowerCase() === typeName.toLowerCase(),
        );
    }

    public async verifyStoredRoles(discordClient: Client) {
        const ev = new EventEmitter({ captureRejections: true });
        const gotRoleById = (
            success: boolean,
            givenId: string,
            fetchedRole?: Role,
        ) => {
            const storedRole = this.getRole({ id: givenId });
            if (!success) {
                if (storedRole === undefined) return;
                discordClient.emit(
                    'warn',
                    stripIndent`
                    verifier - Role exists on file but not in guild.
                    id: ${storedRole.id ?? undefined},
                    name: ${storedRole.value ?? 'undefined?'}
                    Removing...
                `,
                );
                this.removeRole(storedRole);
            } else this.updateRole(storedRole, fetchedRole);
        };
        const gotRoleByName = (
            success: boolean,
            givenName: string,
            fetchedRole?: Role,
        ) => {
            const storedRole = this.getRole({ name: givenName });
            if (!success) {
                if (storedRole === undefined) return;
                discordClient.emit(
                    'warn',
                    stripIndent`
                    verifier (name) - Role exists on file but not in guild.
                    id: ${storedRole.id ?? undefined}
                    name: ${storedRole.value ?? 'undefined?'}
                    Removing...
                    `,
                );
                this.removeRole(storedRole);
            } else this.updateRole(storedRole, fetchedRole);
        };
        ev.once('ready', () => {
            this.types.forEach((type) => {
                if (type.roles.length === 0) {
                    log('warn', `${type.label} exists but has no roles`);
                    return;
                }
                const { roles } = type;
                roles.forEach((role) => {
                    role.type = type.value.toLowerCase();
                    role.id !== undefined
                        ? getRoleById(discordClient, role.id, gotRoleById)
                        : getRoleByName(
                              discordClient,
                              role.value,
                              gotRoleByName,
                          );
                });
            });
        });
        const readyCheck = setInterval(() => {
            if (discordClient.isReady()) {
                clearInterval(readyCheck);
                ev.emit('ready');
            }
        }, 1000);
    }

    public getRole(searchByOptions: { id?: string; name?: string }) {
        const { id, name } = searchByOptions;
        const findRole = (role: StoredRole) =>
            role.value.toLowerCase() === name?.toLowerCase() ||
            (role.id === id && role.id && id);
        const findType = (type: StoredType) => type.roles.find(findRole);
        return this.types.find(findType)?.roles.find(findRole);
    }

    public getRolesFromType(typeName: string, asOptions: true): RoleOptions[];
    public getRolesFromType(typeName: string, asOptions: false): StoredRole[];
    public getRolesFromType(
        typeName: string,
        asOptions?: boolean,
    ): StoredRole[] | RoleOptions[] {
        const type = this.getType(typeName);
        if (asOptions) {
            return type.roles.map((storedRole) =>
                this.convertRoleToOptions(storedRole),
            );
        } else return type.roles;
    }

    public convertRoleToOptions(storedRole: StoredRole): RoleOptions {
        return {
            label: storedRole.label,
            value: storedRole.id,
            description:
                storedRole.description !== undefined
                    ? storedRole.description
                    : undefined,
        };
    }

    public convertTypesToOptions() {
        return this.types.map((type) => {
            return {
                label: type.label,
                description: type.description ?? undefined,
                value: type.value,
            };
        });
    }

    public removeRole(storedRole: StoredRole) {
        const roleIndex = this.getType(storedRole.type).roles.findIndex(
            (role) =>
                (role.id === storedRole.id && storedRole.id && role.id) ||
                role.value.toLowerCase() === storedRole.value.toLowerCase(),
        );
        if (roleIndex === -1) {
            return log(
                'error',
                stripIndent`
                removeRole - role doesn't exist?
                id: ${storedRole.id ?? undefined}
                name: ${storedRole.value.toLowerCase() ?? undefined}`,
            );
        }
        delete this.types[
            this.types.findIndex(
                (type) =>
                    type.value.toLowerCase() === storedRole.type.toLowerCase(),
            )
        ].roles[roleIndex];
        return this.updateFile();
    }

    public updateRole(storedRole: StoredRole, fetchedRole: Role) {
        const roleType = this.getType(storedRole.type);
        const findRole = (role: StoredRole) =>
            role.id === fetchedRole.id ||
            role.value.toLowerCase() === storedRole.value.toLowerCase() ||
            role.value.toLowerCase() === fetchedRole.name.toLowerCase();
        const role = roleType.roles.find(findRole);
        role.value = fetchedRole.name.toLowerCase();
        role.id = fetchedRole.id;
        roleType.roles[roleType.roles.findIndex(findRole)] = role;
        this.types[
            this.types.findIndex(
                (type) =>
                    type.value.toLowerCase() === storedRole.type.toLowerCase(),
            )
        ] = roleType;
        this.updateFile();
    }
    public isTypesEmpty() {
        return this.types.length === 0;
    }

    public isRolesEmpty() {
        let emptyCount = 0;
        this.types.forEach((type) => {
            type.roles.length === 0 ? emptyCount++ : '';
        });
        return this.types.length === emptyCount;
    }

    private updateFile() {
        const data = { roleTypes: this.types };
        writeFile(
            'localData/role_config.json',
            jsonString(data, true),
            { encoding: 'utf8' },
            (err) => {
                if (err) throw err;
            },
        );
    }
}
