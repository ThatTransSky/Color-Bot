import { ClientEvents, Events } from 'discord.js';

export interface EventStructure {
    data: {
        name: keyof ClientEvents;
        once: boolean;
    };
    execute: (...args: any[]) => any;
}
