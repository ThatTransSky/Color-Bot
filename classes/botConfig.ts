// import { readFileSync, writeFileSync } from 'fs';
// import { jsonParse, jsonString } from '../helpers/utils.js';

// export class BotConfig {
//     private config: Partial<SavedConfig>;
//     private readonly configPath = './localData/bot_config.json';
//     constructor() {
//         try {
//             const file = readFileSync(this.configPath, { encoding: 'utf-8' });
//             this.config = { ...jsonParse<Partial<SavedConfig>>(file) };
//         } catch (err) {
//             this.config = { devMode: false };
//             writeFileSync(this.configPath, jsonString(this.config, true));
//         }
//         return;
//     }
// }

// interface SavedConfig {
//     devMode?: boolean | Boolean;
// }
