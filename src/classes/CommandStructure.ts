import { ApplicationCommandData } from "discord.js";

export interface CommandStructure {
	/** The command's data. Follows the same structure as {@link ApplicationCommandData}. */
	data: ApplicationCommandData;
	/** The command's execute callback. */
	execute(...args: any[]): any;
}
