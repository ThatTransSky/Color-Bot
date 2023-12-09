import { readFileSync, writeFile } from 'fs';
import { jsonParse, jsonString, log } from '../helpers/utils.js';

export class TempData {
    private queueArray: string[] = [];
    private dataFile: DataObject[] = [];
    private readonly isIdentifiersEmpty = (data: DataObject) =>
        data.identifiers === undefined;
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
            this.initializeData(jsonParse<TempData>(data));
            this.queueUpdate();
        } catch (err) {
            console.error(err);
            const emptyObj = {
                dataFile: [],
            };
            this.dataFile = [];
            writeFile(
                TempData.savePath,
                jsonString(emptyObj, true),
                { encoding: 'utf8' },
                (err) => {
                    if (err) throw err;
                },
            );
        }
        this.checkExpire();
    }

    private initializeData(fileData: TempData) {
        if (fileData.dataFile === undefined || fileData.dataFile.length === 0) {
            this.updateFile();
            return (this.dataFile = []);
        }
        fileData.dataFile.forEach((data) => {
            const { identifiers, savedData, expire } = data;
            if (this.isIdentifiersEmpty(data)) return;
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
        this.updateFile();
    }

    public addOrUpdateData(data: DataObject) {
        const index = this.findDataIndex(data.identifiers);
        if (index === -1) this.addData(data);
        else this.updateData(data, index);
        return this.queueUpdate();
    }

    private addData(data: DataObject) {
        if (this.isIdentifiersEmpty(data)) return;
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
        return index >= -1 ? this.dataFile[index] : undefined;
    }

    private async checkExpire() {
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
        //* Doesn't matter what we push, as long as it's something
        this.queueArray.push('boo');
    }

    private updateFile() {
        setInterval(() => {
            if (this.queueArray.shift() === undefined) return;
            writeFile(
                TempData.savePath,
                jsonString({ dataFile: this.dataFile }, true),
                { encoding: 'utf8' },
                (err) => {
                    if (err)
                        log(
                            'error',
                            `Error saving file (TempData Class) - ${err}`,
                        );
                },
            );
        }, 354);
    }
}

interface Identifiers {
    messageId?: string;
    userId?: string;
    channelId?: string;
}

interface SavedData {
    roleIds?: string[];
    rolesToAdd?: string[];
    rolesToRemove?: string[];
    desiredAction?: string;
}

interface DataObject {
    identifiers: Identifiers;
    savedData?: SavedData;
    expire?: number;
}
