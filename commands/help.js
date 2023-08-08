export default {
    name: "help",
    category: "bot",
    aliases: [ "h", "commands", "hlp" ],
    async execute(message, args) {
        const lang = fn.getLang(message);
        
        if(args.length === 0) {
            message.reply({ embeds: [ fn.makeEmbed({
                title: locale[lang].commands.help.title,
                description: locale[lang].commands.help.description,
            }) ], components: [
                fn.makeRow({ selectmenu: { id: `typing_${message.author.id}`, placeholder: locale[lang].commands.help.placeholders[0], options: client.commandList.filter(c => c.category === "typing").map(c => ({ name: c.name, value: c.name, description: locale[lang].commands?.[c.name]?.info?.description ?? c.description })) } }),
                fn.makeRow({ selectmenu: { id: `bot_${message.author.id}`, placeholder: locale[lang].commands.help.placeholders[1], options: client.commandList.filter(c => c.category === "bot").map(c => ({ name: c.name, value: c.name, description: locale[lang].commands?.[c.name]?.info?.description ?? c.description})) } }),
            ] });
        } else {
            const command = client.commands.get(args[0]);
            if(!command) return message.reply({ embeds: [ fn.makeError(locale[lang].commands.help.nocommand, message) ] });
            message.reply({ embeds: [ fn.makeEmbed({
                title: command.name,
                description: command.description,
                fields: [
                    [ locale[lang].commands.help.usage, `\`t!${command.name}${locale[lang].commands[command.name].info?.args ? " " : ""}${locale[lang].commands[command.name].info?.args?.map(a => `[${a}]`) ?? ""}\`` ],
                    [ locale[lang].commands.help.aliases, command?.aliases?.map(a => `\`${a}\``).join(", ") ?? locale[lang].commands.help.none ]
                ]
            }) ] });
        }
    }
}