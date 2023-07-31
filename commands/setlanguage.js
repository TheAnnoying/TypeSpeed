export default {
    name: "setlanguage",
    category: "bot",
    aliases: [ "language" ],
    async execute(message, args) {
        let lang = fn.getLang(message);
        const languages = [ "en", "he" ];

        if(message.guild) {
            if(!message.member.permissions.has(Discord.PermissionsBitField.Flags.ManageGuild)) return message.reply({ embeds: [ fn.makeError(locale[lang].commands.setlanguage.noperms, message) ] });
            if(!languages.includes(args[0]) && args[0]) return message.reply({ embeds: [ fn.makeError(locale[lang].commands.setlanguage.nosuchlanguage.replace("langs", languages.map(x => `\`${x}\``).join(", ")), message) ] });
            if(fn.db.guilds.get(message.guild.id) === (args[0] ?? "en")) return message.reply({ embeds: [ fn.makeError(locale[lang].commands.setlanguage.alreadyset.replace("currentlang", fn.db.guilds.get(message.guild.id)))] });

            fn.db.guilds.set(message.guild.id, args[0] ?? "en");
            message.reply({ embeds: [ fn.makeEmbed({ title: locale[args[0] ?? "en"].commands.setlanguage.title, description: locale[args[0] ?? "en"].commands.setlanguage.descriptions[0].replace("newlang", args[0] ?? "en") }) ] });
        } else {
            if(!languages.includes(args[0]) && args[0]) return message.reply({ embeds: [ fn.makeError(locale[lang].commands.setlanguage.nosuchlanguage.replace("langs", languages.map(x => `\`${x}\``).join(", ")), message) ] });
            if(!args[0]) {
                fn.db.users.delete(message.author.id);
                return message.reply({ embeds: [ fn.makeEmbed({ title: "Removed Language", description: "Successfully removed your language, it will now be decided by the guild you're running commands from" }) ] });
            }
            if(fn.db.users.get(message.author.id) === (args[0] ?? "en")) return message.reply({ embeds: [ fn.makeError(locale[lang].commands.setlanguage.alreadyset.replace("currentlang", fn.db.guilds.get(message.guild.id)))] });
            fn.db.users.set(message.author.id, args[0] ?? "en");
            message.reply({ embeds: [ fn.makeEmbed({ title: locale[args[0] ?? "en"].commands.setlanguage.title, description: locale[args[0] ?? "en"].commands.setlanguage.descriptions[1].replace("newlang", args[0] ?? "en") }) ] });
        }
    }
}