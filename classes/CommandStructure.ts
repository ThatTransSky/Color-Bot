import { ApplicationCommandData } from 'discord.js';

export interface CommandStructure {
    data: ApplicationCommandData & { description?: string };
    execute(...args: any[]): any;
}
