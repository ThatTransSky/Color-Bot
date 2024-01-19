import { LocalUtils } from '../helpers/utils.js';

export const data = { name: 'error' };

export async function execute(err: Error) {
    LocalUtils.log('error', err);
    LocalUtils.log('debug', err.stack);
}
