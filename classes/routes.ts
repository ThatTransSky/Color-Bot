import { Client, Interaction } from 'discord.js';
import { CustomIdObj } from '../helpers/componentBuilders.js';

export interface Route {
    anythingElse?: string[];
    secondaryAction?: string;
    stage: string;
    execute?: (
        interaction: Interaction,
        client: Client,
        customIdObj: CustomIdObj,
    ) => any;
    disabled?: boolean;
}
