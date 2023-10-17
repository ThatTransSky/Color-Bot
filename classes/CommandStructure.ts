import { ApplicationCommandData } from 'discord.js';

export interface CommandStructure {
    data: ApplicationCommandData;
    execute(...args: any[]): any;
}
