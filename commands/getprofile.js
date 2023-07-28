export default {
    name: "getprofile",
    category: "typetest",
    description: "Display Type Test-related information on someone",
    args: ["user"],
    aliases: [ "getmember", "getp", "gp", "profile" ],
    async execute(message, args) {
        const member = await fn.memberArg(args[0], { message });
        if (member instanceof Discord.Message) return;

        const tests = fn.db.tests.getTestsFromUser(member.user.id);

        const embed = new fn.makeEmbed({
            color: "#A0B8C0",
            author: [ "Type Test Profile", member.user.displayAvatarURL({ dynamic: true }) ],
            description: `<@${member.user.id}>'s profile`,
            footer: [ "Latest test on" ],
            timestamp: tests?.latest
        });

        if(tests.count === 0) {
            message.reply({ embeds: [ fn.makeError(`\`${member.user.username}\` hasn't taken any tests!`) ] });
        } else {
            embed.addFields(
                { name: "Tests Taken", value: tests.count.toString(), inline: true },
                { name: "Average WPM", value: tests.average.toString(), inline: true }
            )

            message.reply({ embeds: [ embed ] });
        }
    }
}