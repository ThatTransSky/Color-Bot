import { log } from '../helpers/utils.js';

export const data = { name: 'error' };

export async function execute(err: Error) {
    log('error', err);
}
