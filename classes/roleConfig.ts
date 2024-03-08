import { stripIndent } from 'common-tags';
import { readFileSync, writeFile } from 'fs';
import { Client, Role } from 'discord.js';
import { EventEmitter } from 'events';
import { getRoleById, getRoleByName } from '../helpers/discordHelpers.js';
import { newEmbed } from '../helpers/componentBuilders.js';
import { LocalUtils } from '../helpers/utils.js';

interface RoleOptions {
    value: string;
    description?: string;
    label: string;
}
export interface StoredRole extends RoleOptions {
    type: string;
    id?: string;
}
interface RoleType {
    value: string;
    description?: string;
    label: string;
}
export interface StoredType extends RoleType {
    multiRoleType?: boolean;
    roles?: StoredRole[];
    minChoices?: number;
    maxChoices?: number;
}

export class RoleConfig {
    public multiRoleTypeNames: string[];
    public types: StoredType[];
    public guildId: string = '';
    private makePath = <Content extends string>(
        guildId: Content,
    ): `localData/${Content}/role_config.json` =>
        `localData/${guildId}/role_config.json`;

    public selectRolesEmbed = (roleType: string) =>
        newEmbed(
            'Role Menu',
            stripIndent`
    You have selected ${LocalUtils.uppercaseWord(roleType)}!

    Use the menu below to select the role(s) you would like to add / remove:
    ${(() => {
        if (this.multiRoleTypeNames.includes(roleType.toLowerCase())) {
            return '(*In this category, you can select multiple roles. When you are done selecting, click out of the menu to finalize your decision.*)';
        } else return '';
    })()}`,
            true,
            'Random',
        );
    constructor(guildId: string) {
        try {
            this.guildId = guildId;
            const data = readFileSync(this.makePath(guildId), 'utf8');
            this.types = LocalUtils.jsonParse<any>(data).roleTypes;
            this.multiRoleTypeNames = this.types.map((type) => {
                if (type?.multiRoleType) return type?.value;
            });
            this.validateData();
        } catch (err) {
            this.types = [];
            this.multiRoleTypeNames = [];
            this.updateFile();
        }
        LocalUtils.log('success', `roleConfig - ${guildId}: Config ready.`);
    }
    public getType(typeName: string): StoredType {
        return this.types.find(
            (type) => type?.value.toLowerCase() === typeName.toLowerCase(),
        );
    }

    private validateData(): this {
        this.types.forEach((type) => {
            if (type?.multiRoleType) {
                let { minChoices, maxChoices } = type;
                // min is required, max is optional.
                if (minChoices === undefined || minChoices <= 0) {
                    minChoices = 1;
                }
                if (maxChoices !== undefined && minChoices > maxChoices) {
                    maxChoices = minChoices;
                }
                type = {
                    ...type,
                    minChoices: minChoices,
                    maxChoices: maxChoices,
                };
            }
        });
        this.updateFile();
        return this;
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
                    name: ${storedRole.label ?? 'undefined?'}
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
                if (type?.roles?.length === 0) {
                    LocalUtils.log(
                        'warn',
                        `${type?.label} exists but has no roles`,
                    );
                    return;
                }
                const { roles } = type;
                roles?.forEach((role) => {
                    role.type = type?.value.toLowerCase();
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
        const findType = (type: StoredType) => type?.roles?.find(findRole);
        return this.types.find(findType)?.roles?.find(findRole);
    }

    public getRolesFromType(typeName: string, asOptions: true): RoleOptions[];
    public getRolesFromType(typeName: string, asOptions: false): StoredRole[];
    public getRolesFromType(
        typeName: string,
        asOptions?: boolean,
    ): StoredRole[] | RoleOptions[] {
        const type = this.getType(typeName);
        if (asOptions) {
            return type?.roles?.map((storedRole) =>
                this.convertRoleToOptions(storedRole),
            );
        } else return type?.roles;
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
                label: type?.label,
                description: type?.description ?? undefined,
                value: type?.value,
            };
        });
    }

    public removeRole(storedRole: StoredRole) {
        const roleIndex = this.getType(storedRole.type).roles?.findIndex(
            (role) =>
                (role.id === storedRole.id && storedRole.id && role.id) ||
                role.value.toLowerCase() === storedRole.value.toLowerCase(),
        );
        if (roleIndex === -1) {
            return LocalUtils.log(
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
                    type?.value.toLowerCase() ===
                    storedRole.type?.toLowerCase(),
            )
        ].roles[roleIndex];
        return this.updateFile();
    }

    public addRoles(roles: StoredRole[]): {
        succuss: boolean;
        reason?: 'notSameType' | 'roleExists' | 'typeNotExist';
    } {
        let allSameType = true;
        let anyRoleExist = false;
        const type = this.getType(roles[0].type);
        if (type === undefined) {
            return {
                succuss: false,
                reason: 'typeNotExist',
            };
        }
        roles?.forEach((role) => {
            allSameType =
                type?.value.toLowerCase() === role.type?.toLowerCase();
            anyRoleExist =
                type?.roles?.find((storedRole) => storedRole.id === role.id) !==
                undefined;
        });
        if (!allSameType) {
            return {
                succuss: false,
                reason: 'notSameType',
            };
        }
        if (anyRoleExist) {
            return {
                succuss: false,
                reason: 'roleExists',
            };
        }
        type.roles = roles;
        return {
            succuss: true,
        };
    }

    public addType(
        type: StoredType,
        roles?: StoredRole[],
    ): {
        success: boolean;
        reason?: 'typeValueAlreadyExists';
    } {
        LocalUtils.log('log', LocalUtils.jsonString(type, true));
        // Meaning, if the 'value' was not already lowercased
        type = this.lowercaseTypeValue(type);
        if (this.getType(type?.value) !== undefined)
            return {
                success: true,
                reason: 'typeValueAlreadyExists',
            };
        this.types.push(type);
        if (!LocalUtils.isArrayEmpty(roles)) {
            roles?.forEach((role, i) => {
                role.type = type?.value;
                roles[i] = role;
            });
            this.types[
                this.types.findIndex(
                    (storedType) => storedType.value === type?.value,
                )
            ].roles = roles;
        }
        this.updateFile();
        return {
            success: true,
        };
    }

    public updateRole(storedRole: StoredRole, fetchedRole: Role) {
        const roleType = this.getType(storedRole.type);
        const findRole = (role: StoredRole) =>
            role.id === fetchedRole.id ||
            role.value.toLowerCase() === storedRole.value.toLowerCase() ||
            role.value.toLowerCase() === fetchedRole.name.toLowerCase();
        const role = roleType.roles?.find(findRole);
        role.value = fetchedRole.name.toLowerCase();
        role.id = fetchedRole.id;
        roleType.roles[roleType.roles?.findIndex(findRole)] = role;
        this.types[
            this.types.findIndex(
                (type) =>
                    type?.value.toLowerCase() ===
                    storedRole.type?.toLowerCase(),
            )
        ] = roleType;
        this.updateFile();
    }
    public isTypesEmpty() {
        return this.types?.length === 0;
    }

    public isRolesEmpty() {
        let emptyCount = 0;
        this.types.forEach((type) => {
            LocalUtils.isArrayEmpty(type.roles) ? emptyCount++ : undefined;
        });
        return this.types.length === emptyCount;
    }

    private updateFile() {
        const data = { roleTypes: this.types };
        const objStr = LocalUtils.jsonString(data, true);
        writeFile(
            this.makePath(this.guildId),
            objStr,
            { encoding: 'utf8' },
            (err) => {
                if (err) throw err;
            },
        );
    }

    private lowercaseTypeValue(type: StoredType): StoredType {
        if (type?.value !== type?.value.toLowerCase()) {
            const stack = new Error('Stack for reference');
            LocalUtils.log(
                'warn',
                stripIndent`
                RoleConstants - WARN: type?.value was passed before being lowercased.
                Please refer to the stack below:
                ${stack}
                `,
            );
            return { ...type, value: type?.value.toLowerCase() };
        }
        return type;
    }
}
