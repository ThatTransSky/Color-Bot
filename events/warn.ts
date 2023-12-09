import { log } from '../helpers/utils.js';

export const data = { name: 'warn' };

export async function execute(warningMessage: string) {
    log('warn', warningMessage);
}
