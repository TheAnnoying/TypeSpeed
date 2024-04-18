export default {
    name: "help",
    options: [{
        name: "command",
        description: "The command you'd like to view information about",
        required: false,
        autocomplete: true,
        type: 3
    }],
    async execute(interaction) {
        const lang = fn.getLang(interaction);
        const command = client.commands.get(interaction.options.getString("command"));

        if(!command) {
            interaction.reply({ embeds: [ fn.makeEmbed({
                title: locale[lang].commands.help.title,
                description: locale[lang].commands.help.description,
            }) ], components: [
                fn.makeRow({ selectmenu: { id: `typing_${interaction.member.user.id}`, placeholder: locale[lang].commands.help.placeholders[0], options: client.commandList.filter(c => c.category === "typing").map(c => ({ name: c.name, value: c.name, description: locale[lang].commands?.[c.name]?.info?.description ?? c.description })) } }),
                fn.makeRow({ selectmenu: { id: `bot_${interaction.member.user.id}`, placeholder: locale[lang].commands.help.placeholders[1], options: client.commandList.filter(c => c.category === "bot").map(c => ({ name: c.name, value: c.name, description: locale[lang].commands?.[c.name]?.info?.description ?? c.description})) } }),
            ] });
        } else {
            interaction.reply({ embeds: [ fn.makeEmbed({
                title: command.name,
                description: locale[lang].commands[command.name].info.description,
                fields: [
                    [ locale[lang].commands.help.usage, `\`t!${command.name}${locale[lang].commands[command.name].info?.args ? " " : ""}${locale[lang].commands[command.name].info?.args?.map(a => `[${a}]`) ?? ""}\`` ],
                    [ locale[lang].commands.help.aliases, command?.aliases?.map(a => `\`${a}\``).join(", ") ?? locale[lang].commands.help.none ],
                ],
                footer: [ command.category ]
            }) ] });
        }
    },
    autocomplete(interaction) {
        const focused = interaction.options.getFocused().toLowerCase();
    
        const matchingCommands = client.commandList.filter(command => command.name.toLowerCase().includes(focused));
        if(matchingCommands.length > 25) matchingCommands.length = 25;
    
        interaction.respond(matchingCommands.map(command => {
            return {
                name: command.name,
                value: command.name
            }
        }));
    }
}