import { readFileSync, writeFile } from 'fs';
import { LocalUtils } from '../helpers/utils.js';
import { StoredRole, StoredType } from './roleConfig.js';
import { ButtonBuilder, ButtonStyle, Interaction, italic } from 'discord.js';
import { stripIndent } from 'common-tags';
import { newButtonRow } from '../helpers/componentBuilders.js';

export class TempData {
    private queueArray: string[] = [];
    private dataFile: DataObject[] = [];
    private readonly isIdentifiersEmpty = (identifiers: Identifiers) =>
        identifiers === undefined ||
        (identifiers.channelId === undefined &&
            identifiers.messageId === undefined &&
            identifiers.userId === undefined);
    private static readonly savePath = './localData/tempData.json';
    public static readonly emptyData: DataObject = {
        identifiers: {},
        savedData: {},
        expire: Date.now() + 1000 * 60, // 1 minute from now
    };
    public static async expiredDataResponse(
        interaction: Interaction,
    ): Promise<void> {
        if (interaction.isRepliable()) {
            const restartButtonRow = newButtonRow(
                'roles',
                [
                    new ButtonBuilder()
                        .setCustomId(
                            LocalUtils.buildCustomId({
                                mainAction: 'roles',
                                secondaryAction: 'manageRoles',
                                stage: 'startMessage',
                                anythingElse: ['back'],
                            }),
                        )
                        .setLabel('Restart: Manage Roles')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(
                            LocalUtils.buildCustomId({
                                mainAction: 'roles',
                                secondaryAction: 'userRoles',
                                stage: 'selectType',
                                anythingElse: ['back'],
                            }),
                        )
                        .setLabel('Restart: Choose Roles')
                        .setStyle(ButtonStyle.Secondary),
                ],
                true,
            );
            await interaction.editReply({
                content: stripIndent`
                Interaction Data timed out, please try again later.
                ${italic(
                    '(Note: Most interaction data expires within 5-15 minutes)',
                )}
                `,
                embeds: [],
                components: [restartButtonRow],
            });
            return;
        } else {
            return LocalUtils.log(
                'warn',
                stripIndent`
                WARN - expiredDataResponse called for a non-repliable interaction. Interaction type - ${LocalUtils.interactionTypeToString(
                    interaction,
                )}.`,
            );
        }
    }
    public static readonly typeToSavedData = (typeDetails: StoredType) =>
        LocalUtils.jsonParse<SavedData>(`{
            "manageRoles": {
                "typeDetails": ${LocalUtils.jsonString(typeDetails)}
            }
        }`);
    public static readonly editedTypeToSavedData = (typeDetails: StoredType) =>
        LocalUtils.jsonParse<SavedData>(`{
        "manageRoles": {
            "editedTypeDetails": ${LocalUtils.jsonString(typeDetails)}
        }
    }`);
    public static readonly rolesToSavedData = (roles: StoredRole[]) =>
        LocalUtils.jsonParse<SavedData>(`{
            "manageRoles": {
                "rolesDetails": ${LocalUtils.jsonString(roles)}
            }
        }`);
    private static readonly defaultExpireAmount = 5 * 60 * 1000; // 5 seconds * 60 = 5 minutes
    private static readonly defaultExpire = () =>
        Date.now() + TempData.defaultExpireAmount;

    constructor() {
        try {
            const data = readFileSync(TempData.savePath, { encoding: 'utf8' });
            this.validateData(
                LocalUtils.jsonParse<{ dataFile: DataObject[] }>(data).dataFile,
            );
        } catch (err) {
            this.dataFile = [];
            this.instantFileUpdate();
        }
        this.checkExpireLoop();
        this.updateFileLoop();
    }

    private validateData(fileData: DataObject[]) {
        if (fileData === undefined || fileData.length === 0) {
            this.dataFile = [];
            this.queueUpdate();
            return;
        }
        fileData.forEach((data) => {
            const { identifiers, savedData, expire } = data;
            if (this.isIdentifiersEmpty(data.identifiers)) return;
            const dataToAdd = {
                identifiers: identifiers,
                savedData: savedData,
                expire:
                    expire !== undefined && expire !== 0
                        ? expire + TempData.defaultExpireAmount
                        : TempData.defaultExpire(),
            };
            this.addOrUpdateData(dataToAdd);
        });
    }

    /**
     * Method extends the data's expire time by a specified amount (or default, if unspecified)
     * and returns the updated expire timestamp (in ms).
     */
    public extendExpire(
        identifiers: Identifiers,
        timeInSeconds: number = TempData.defaultExpireAmount, // 5 seconds
    ) {
        const data = this.getData(identifiers);
        const updatedData = this.addOrUpdateData({
            ...data,
            expire:
                data.expire !== undefined
                    ? data.expire + timeInSeconds * 1000
                    : Date.now() + timeInSeconds * 1000,
        });
        return updatedData.expire;
    }

    public updateSavedData(
        identifiers: Identifiers,
        dataToSave: Partial<SavedData>,
    ) {
        const dataIndex = this.findDataIndex(identifiers);
        if (dataIndex === -1) return false;
        let data = this.dataFile[dataIndex];
        data = {
            ...data,
            savedData: dataToSave,
            expire:
                data.expire !== undefined
                    ? data.expire + 1000 * 60 // 1 minute
                    : TempData.defaultExpire(),
        };
        this.dataFile[dataIndex] = data;
        this.queueUpdate();
    }

    public addOrUpdateData(data: DataObject): DataObject {
        const index = this.findDataIndex(data.identifiers);
        if (index === -1) return this.addData(data);
        else this.updateData(data, index);
        this.queueUpdate();
        return this.dataFile[index];
    }

    private addData(data: DataObject) {
        if (this.isIdentifiersEmpty(data.identifiers)) return;
        this.dataFile.push({
            identifiers: data.identifiers,
            savedData: data.savedData,
            expire:
                data.expire !== undefined
                    ? data.expire
                    : TempData.defaultExpire(),
        });
        return data;
    }

    private updateData(data: DataObject, index: number) {
        this.dataFile[index] = {
            ...data,
            expire:
                data.expire !== undefined
                    ? data.expire
                    : TempData.defaultExpire(),
        };
    }

    public getData(identifiers: Identifiers) {
        const index = this.findDataIndex(identifiers);
        return index !== -1 ? this.dataFile[index] : undefined;
    }

    public getManageRolesData(identifiers: Identifiers) {
        const manageRolesData =
            this.getData(identifiers)?.savedData?.manageRoles;
        return {
            ...manageRolesData,
        };
    }

    public getTypeFromData(
        identifiers: Identifiers,
        action: 'new' | 'edit' = 'new',
    ) {
        return LocalUtils.isStringEmpty(action) || action === 'new'
            ? this.getData(identifiers)?.savedData?.manageRoles?.typeDetails
            : this.getData(identifiers)?.savedData?.manageRoles
                  ?.editedTypeDetails;
    }

    public updateTypeInData(
        identifiers: Identifiers,
        typeDetails: StoredType,
        action: 'new' | 'edit' = 'new',
    ): boolean {
        const data = this.getData(identifiers);
        if (data === undefined) return false;
        if (action === 'edit') {
            data.savedData.manageRoles.editedTypeDetails = typeDetails;
        } else {
            data.savedData.manageRoles.typeDetails = typeDetails;
        }
        this.addOrUpdateData({
            ...data,
            expire: data.expire + TempData.defaultExpireAmount,
        });
        this.queueUpdate();
        return true;
    }

    private checkExpireLoop() {
        setInterval(() => {
            const beforeLength = this.dataFile.length;
            this.dataFile.forEach((data, index) => {
                if (data.expire === undefined) {
                    return (this.dataFile[index].expire =
                        TempData.defaultExpire());
                }
                if (data.expire <= Date.now()) {
                    this.removeDataByIndex(index);
                }
            });
            const afterLength = this.dataFile.length;
            if (beforeLength !== afterLength) this.queueUpdate();
        }, 500);
    }

    public removeData(identifiers: Identifiers) {
        const index = this.findDataIndex(identifiers);
        if (index === -1) return false;
        this.removeDataByIndex(index);
        this.queueUpdate();
        return true;
    }

    private removeDataByIndex(givenIndex: number) {
        this.dataFile = this.dataFile.filter((_, i) => i !== givenIndex);
    }

    private findDataIndex(identifiers: Identifiers) {
        const sameCheck = (data: DataObject) => {
            const { channelId, messageId, userId } = data.identifiers;
            const same =
                (channelId || channelId === identifiers.channelId) &&
                (messageId || messageId === identifiers.messageId) &&
                (userId || userId === identifiers.userId);
            return same;
        };
        return this.dataFile.findIndex(sameCheck);
    }

    private queueUpdate() {
        //* Doesn't matter what we push, as long as it's something.
        this.queueArray.push('yahoo, an update is here!');
    }

    private updateFileLoop() {
        setInterval(() => {
            if (this.queueArray.shift() === undefined) return;
            writeFile(
                TempData.savePath,
                LocalUtils.jsonString({ dataFile: this.dataFile }, true),
                { encoding: 'utf8' },
                (err) => {
                    if (err)
                        LocalUtils.log(
                            'error',
                            `Error saving file (TempData Class) - ${err}`,
                        );
                },
            );
        }, 1000);
    }

    public countTotalData() {
        let count = 0;
        this.dataFile.forEach((data) => {
            if (data.identifiers !== undefined) count++;
        });
        return count;
    }

    public clearData() {
        this.dataFile = [];
        this.instantFileUpdate();
    }

    private instantFileUpdate() {
        const stack = new Error().stack;
        LocalUtils.log(
            'debug',
            `instantFileUpdate for TempData called, outputting last stack entry (before this one):\n ${
                stack.split('\n')[2]
            }`,
        );
        writeFile(
            TempData.savePath,
            LocalUtils.jsonString({ dataFile: this.dataFile }, true),
            { encoding: 'utf8' },
            (err) => {
                if (err)
                    LocalUtils.log(
                        'error',
                        `Error saving file (TempData Class) - ${err}`,
                    );
            },
        );
    }
}

interface Identifiers {
    messageId?: string;
    userId?: string;
    channelId?: string;
}

interface SavedData {
    chooseRoles?: {
        currentTypeValue?: string;
        roleIds?: string[];
        rolesToAdd?: string[];
        rolesToRemove?: string[];
        desiredAction?: string;
    };
    manageRoles?: {
        typeDetails?: StoredType;
        editedTypeDetails?: StoredType;
        rolesDetails?: StoredRole[];
    };
}

interface DataObject {
    identifiers: Identifiers;
    savedData?: SavedData;
    expire?: number;
}
