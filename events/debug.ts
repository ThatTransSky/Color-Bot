import { LocalUtils } from '../helpers/utils.js';

export const data = { name: 'debug' };

export async function execute(debug: string) {
    LocalUtils.log('debug', debug);
}
