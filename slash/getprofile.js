export default {
    name: "getprofile",
    options: [{
        name: "member",
        description: "The member whose profile you'd like to view",
        type: 6
    }],
    async execute(interaction) {
        const lang = fn.getLang(interaction);
        const member = interaction.options.getMember("member") ?? interaction.member;

        const tests = fn.db.tests.getTestsFromUser(member.user.id);

        const embed = new fn.makeEmbed({
            color: "#A0B8C0",
            author: [ locale[lang].commands.getprofile.author, member.user.displayAvatarURL({ dynamic: true }) ],
            description: locale[lang].commands.getprofile.description.replace("member", member),
            footer: [ locale[lang].commands.getprofile.footer ],
            timestamp: tests?.latest
        });

        if(tests.count === 0) {
            interaction.reply({ ephemeral: true, embeds: [ fn.makeError(locale[lang].commands.getprofile.noteststaken.replace("username", member.user.username), interaction) ] });
        } else {
            embed.addFields(
                { name: locale[lang].commands.getprofile.fields[0], value: tests.count.toString(), inline: true },
                { name: locale[lang].commands.getprofile.fields[1], value: tests.average.toString(), inline: true },
                { name: locale[lang].commands.getprofile.fields[2], value: tests.bestwpm.toString(), inline: true }
            )

            interaction.reply({ embeds: [ embed ] });
        }
    }
}