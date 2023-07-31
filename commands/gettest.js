import ms from "ms";

export default {
    name: "gettest",
    category: "typing",
    aliases: [ "getest", "findtest", "gt" ],
    async execute(message, args) {
        const lang = fn.db.guilds.get(message.guild.id);
        const providedId = parseFloat(args[0]);
        
        if(!providedId) return message.reply({ embeds: [ fn.makeError(locale[lang].commands.gettest.provideid) ] });
        if(providedId <= 0) return message.reply({ embeds: [ fn.makeError(locale[lang].commands.gettest.positivenumber) ] });
        if(providedId % 1 !== 0) return message.reply({ embeds: [ fn.makeError(locale[lang].commands.gettest.wholenumber) ] });

        const test = fn.db.tests.getTestFromId(providedId);
        if(!test) return message.reply({ embeds: [ fn.makeError(locale[lang].commands.gettest.doesntexist.replace("id", providedId)) ] })
        const user = await fn.getUser(test.user);

        message.reply({ embeds: [
            fn.makeEmbed({
                author: [ user.username, user.displayAvatarURL({ dynamic: true }) ],
                fields: [
                    [ "WPM", `${test.wpm}${test.grosswpm === test.wpm ? "" : ` (${locale[lang].commands.typetest.raw}: ${test.grosswpm})`}` ],
                    [ locale[lang].commands.typetest.timetook, ms(test.timetook), true ],
                    [ locale[lang].commands.typetest.accuracy, `${test.accuracy}%${test.accuracy === 100 ? "" : ` (${test.mistakes} ${test.mistakes === 1 ? locale[lang].commands.typetest.mistake : locale[lang].commands.typetest.mistakes})`}`, true ]
                ],
                footer: [ `ID: ${test.id.toString()}` ],
                timestamp: test.time
            })
        ], components: [ fn.makeRow({ buttons: [{ label: locale[lang].buttons.deletetest.label, id: `delete_${message.member.user.id}_${test.id}`, style: "danger" }] }) ] });
    }
}