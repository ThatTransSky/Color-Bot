import { GuildMember } from "discord.js";
import { EventStructure } from "../classes/EventStructure.js";

export const data = {
	name: "guildMemberAdd",
	once: false,
};
export async function execute(member: GuildMember) {
	const memberRoles = member.roles;
	if (
		memberRoles.cache.has("1015742637904506911") === false &&
		!member.user.bot
	) {
		memberRoles.add("1015742637904506911");
	}
}
