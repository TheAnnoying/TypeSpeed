export default {
    name: "getprofile",
    category: "typing",
    aliases: [ "getmember", "getp", "gp", "profile" ],
    async execute(message, args) {
        const lang = fn.db.guilds.get(message.guild.id);
        const member = await fn.memberArg(args[0], { message });
        if (member instanceof Discord.Message) return;

        const tests = fn.db.tests.getTestsFromUser(member.user.id);

        const embed = new fn.makeEmbed({
            color: "#A0B8C0",
            author: [ locale[lang].commands.getprofile.author, member.user.displayAvatarURL({ dynamic: true }) ],
            description: locale[lang].commands.getprofile.description.replace("member", member),
            footer: [ locale[lang].commands.getprofile.footer ],
            timestamp: tests?.latest
        });

        if(tests.count === 0) {
            message.reply({ embeds: [ fn.makeError(locale[lang].commands.getprofile.noteststaken.replace("username", member.user.username), message) ] });
        } else {
            embed.addFields(
                { name: locale[lang].commands.getprofile.fields[0], value: tests.count.toString(), inline: true },
                { name: locale[lang].commands.getprofile.fields[1], value: tests.average.toString(), inline: true }
            )

            message.reply({ embeds: [ embed ] });
        }
    }
}