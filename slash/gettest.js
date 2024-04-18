import ms from "ms";

export default {
    name: "gettest",
    options: [{
        name: "test-id",
        description: "The ID of the test you'd like to view",
        min_value: 1,
        type: 4
    }],
    async execute(interaction) {
        const lang = fn.getLang(interaction);
        const providedId = interaction.options.getInteger("test-id");

        const test = fn.db.tests.getTestFromId(providedId);
        if(!test) return interaction.reply({ ephemeral: true, embeds: [ fn.makeError(locale[lang].commands.gettest.doesntexist.replace("id", providedId), interaction) ] })
        const user = await fn.getUser(test.user);

        interaction.reply({ embeds: [
            fn.makeEmbed({
                author: [ user.username, user.displayAvatarURL({ dynamic: true }) ],
                fields: [
                    [ "WPM", `${test.wpm}${test.grosswpm === test.wpm ? "" : ` (${locale[lang].commands.typetest.raw}: ${test.grosswpm})`}` ],
                    [ locale[lang].commands.gettest.language, locale[lang].commands.setlanguage.languages[test.lang] ?? locale[lang].commands.gettest.unknown, true ],
                    [ locale[lang].commands.typetest.timetook, ms(test.timetook), true ],
                    [ locale[lang].commands.typetest.accuracy, `${test.accuracy}%${test.accuracy === 100 ? "" : ` (${test.mistakes} ${test.mistakes === 1 ? locale[lang].commands.typetest.mistake : locale[lang].commands.typetest.mistakes})`}`, true ]
                ],
                footer: [ `ID: ${test.id.toString()}` ],
                timestamp: test.time
            })
        ], components: [ fn.makeRow({ buttons: [{ label: locale[lang].buttons.deletetest.label, id: `delete_${test.id}`, style: "danger" }] }) ] });
    }
}