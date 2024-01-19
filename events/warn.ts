import { LocalUtils } from '../helpers/utils.js';

export const data = { name: 'warn' };

export async function execute(warningMessage: string) {
    LocalUtils.log('warn', warningMessage);
}
