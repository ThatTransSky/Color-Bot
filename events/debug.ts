import { log } from '../helpers/utils.js';

export const data = { name: 'debug' };

export async function execute(debug: string) {
    log('debug', debug);
}
