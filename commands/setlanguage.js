export default {
    name: "setlanguage",
    category: "bot",
    aliases: [ "language" ],
    async execute(message, args) {
        let lang = fn.getLang(message);
        const languages = locale[lang].commands.setlanguage.languages;
        const options = Object.keys(locale).map(x => ({ name: languages[x], value: x }));
        options.forEach((option, index) => { if(option.value === lang) options.splice(index, 1) });

        if(message.guild) {
            if(!message.member.permissions.has(Discord.PermissionsBitField.Flags.ManageGuild)) return message.reply({ embeds: [ fn.makeError(locale[lang].commands.setlanguage.noperms, message) ] });

            message.reply({
                embeds: [ fn.makeEmbed({ title: locale[lang].commands.setlanguage.title, description: locale[lang].commands.setlanguage.descriptions[0] }) ],
                components: [ fn.makeRow({ selectmenu: { id: "lang", placeholder: locale[lang].commands.setlanguage.components[0], options } }) ]
            });
        } else {
            message.reply({
                embeds: [ fn.makeEmbed({ title: locale[lang].commands.setlanguage.title, description: locale[lang].commands.setlanguage.descriptions[1] }) ],
                components: [ fn.makeRow({ selectmenu: { id: "lang", placeholder: locale[lang].commands.setlanguage.components[0], options } }), fn.makeRow({ buttons: [{ label: locale[lang].commands.setlanguage.components[1], style: "danger", id: "resetlang" }] }) ]
            });
        }
    }
}