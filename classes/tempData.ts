import { readFileSync, writeFile } from 'fs';
import { LocalUtils } from '../helpers/utils.js';
import { StoredRole, StoredType } from './roleConfig.js';

export class TempData {
    private queueArray: string[] = [];
    private dataFile: DataObject[] = [];
    private readonly isIdentifiersEmpty = (identifiers: Identifiers) =>
        identifiers === undefined ||
        (identifiers.channelId === undefined &&
            identifiers.messageId === undefined &&
            identifiers.userId === undefined);
    private static readonly savePath = './localData/tempData.json';
    private static readonly emptyData = {
        identifiers: {},
        savedData: {},
        expire: 0,
    };
    private readonly defaultExpireAmount = 5000 * 60; // 5 seconds * 60 = 5 minutes
    private readonly defaultExpire = () =>
        Date.now() + this.defaultExpireAmount;
    constructor() {
        try {
            const data = readFileSync(TempData.savePath, { encoding: 'utf8' });
            this.validateData(
                LocalUtils.jsonParse<{ dataFile: DataObject[] }>(data).dataFile,
            );
            this.queueUpdate();
        } catch (err) {
            console.error(err);
            const emptyObj = {
                dataFile: [],
            };
            this.dataFile = [];
            writeFile(
                TempData.savePath,
                LocalUtils.jsonString(emptyObj, true),
                { encoding: 'utf8' },
                (err) => {
                    if (err) throw err;
                },
            );
        }
        this.checkExpire();
        this.updateFile();
    }

    private validateData(fileData: DataObject[]) {
        if (fileData === undefined || fileData.length === 0) {
            this.updateFile();
            return (this.dataFile = []);
        }
        fileData.forEach((data) => {
            const { identifiers, savedData, expire } = data;
            if (this.isIdentifiersEmpty(data.identifiers)) return;
            const dataToAdd = {
                identifiers: identifiers,
                expire:
                    expire !== undefined && expire !== 0
                        ? expire + this.defaultExpireAmount
                        : this.defaultExpire(),
                savedData: savedData !== undefined ? savedData : {},
            };
            this.addOrUpdateData(dataToAdd);
        });
        this.queueUpdate();
    }

    /** Default time is 5 minutes. */
    public extendExpire(
        identifiers: Identifiers,
        timeInSeconds: number = 5 * 60,
    ) {
        const currExpire = this.getData(identifiers)?.expire;
        this.addOrUpdateData({
            identifiers: identifiers,
            expire:
                currExpire !== undefined
                    ? currExpire + timeInSeconds * 1000
                    : Date.now() + timeInSeconds * 1000,
        });
    }

    public addOrUpdateData(data: DataObject) {
        const index = this.findDataIndex(data.identifiers);
        if (index === -1) this.addData(data);
        else this.updateData(data, index);
        return this.queueUpdate();
    }

    private addData(data: DataObject) {
        if (this.isIdentifiersEmpty(data.identifiers)) return;
        this.dataFile.push({
            identifiers: data.identifiers,
            savedData: data.savedData ?? {},
            expire:
                data.expire !== undefined ? data.expire : this.defaultExpire(),
        });
    }

    private updateData(data: DataObject, index: number) {
        const currData = this.dataFile[index];
        this.dataFile[index] = {
            ...currData,
            ...data,
            expire:
                data.expire !== undefined ? data.expire : this.defaultExpire(),
        };
    }

    public getData(identifiers: Identifiers) {
        const index = this.findDataIndex(identifiers);
        return index !== -1 ? this.dataFile[index] : undefined;
    }

    private checkExpire() {
        setInterval(() => {
            const beforeLength = this.dataFile.length;
            this.dataFile.forEach((data, index) => {
                if (data.expire === undefined) {
                    return (this.dataFile[index].expire = this.defaultExpire());
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
        if (index === -1) return;
        this.removeDataByIndex(index);
    }

    private removeDataByIndex(givenIndex: number) {
        this.dataFile = this.dataFile.filter((_, i) => i !== givenIndex);
        this.queueUpdate();
    }

    private findDataIndex(identifiers: Identifiers) {
        //! REMEMBER TO ADD NEW IDENTIFIERS TO THE CHECK
        const sameCheck = (data: DataObject) => {
            const { channelId, messageId, userId } = data.identifiers;
            const same =
                (!channelId || channelId === identifiers.channelId) &&
                (!messageId || messageId === identifiers.messageId) &&
                (!userId || userId === identifiers.userId);
            return same;
        };
        return this.dataFile.findIndex(sameCheck);
    }

    private queueUpdate() {
        //* Doesn't matter what we push, as long as it's something.
        this.queueArray.push('boo');
    }

    private updateFile() {
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
        }, 354);
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
        this.queueUpdate();
    }

    // private updateDataFile() {
    //     setInterval(() => {
    //         if (!LocalUtils.isArrayEmpty(this.queueArray)) return;
    //         const file = LocalUtils.jsonParse<{ dataFile: DataObject[] }>(
    //             readFileSync(TempData.savePath, { encoding: 'utf8' }),
    //         );
    //         this.dataFile = this.validateData(file.dataFile);
    //     }, 30000);
    // }
}

interface Identifiers {
    messageId?: string;
    userId?: string;
    channelId?: string;
}

interface SavedData {
    roles?: {
        roleIds?: string[];
        rolesToAdd?: string[];
        rolesToRemove?: string[];
        desiredAction?: string;
    };
    manageRoles?: {
        typeDetails?: StoredType;
        rolesDetails?: StoredRole[];
    };
    /** The stored values should match up with the interaction's _Secondary Action_. */
    isOnCooldown?: string[];
}

interface DataObject {
    identifiers: Identifiers;
    savedData?: SavedData;
    expire?: number;
}
