// import { Events } from "discord.js";
// import { Client2 } from "../main.js";

export interface EventStructure {
	/** The event's data. */
	data: {
		/** The event's name. */
		name: string;
		/** True if the event should run once, otherwise keeps the event on. */
		once: boolean;
	};
	/** The event's execute callback. Runs when event is emitted. Will *always* have client as a first argument. */
	execute: (...args: any[]) => any;
}
