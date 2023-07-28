export const name = 'guildMemberAdd';
export async function execute(member) {
    const memberRoles = member.roles;
    if (memberRoles.cache.has('1015742637904506911') === false && !member.user.bot) {
        memberRoles.add('1015742637904506911');
    }
}
