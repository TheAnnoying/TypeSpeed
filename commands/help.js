export default {
    name: "help",
    category: "bot",
    description: "Get a list of available bot commands",
    args: ["optional: command name"],
    aliases: [ "h", "commands" ],
    async execute(message, args, client) {
        if(args.length === 0) {
            message.reply({ embeds: [ fn.makeEmbed({
                title: "Help Menu",
                description: "Select a command to view more information about it",
            }) ], components: [
                fn.makeRow({ selectmenu: { id: "typetest", placeholder: "Command from category: typetest", options: client.commandList.filter(c => c.category === "typetest").map(c => ({ name: c.name, value: c.name, description: c.description })) } }),
                fn.makeRow({ selectmenu: { id: "bot", placeholder: "Command from category: bot", options: client.commandList.filter(c => c.category === "bot").map(c => ({ name: c.name, value: c.name, description: c.description })) } }),
            ] });
        } else {
            const command = client.commands.get(args[0]);
            if(!command) return message.reply({ embeds: [ fn.makeError("That command does not exist") ] });
            message.reply({ embeds: [ fn.makeEmbed({
                title: command.name,
                description: command.description,
                fields: [
                    [ "Usage", `\`t!${command.name}${command?.args ? " " : ""}${command?.args?.map(a => `[${a}]`) ?? ""}\`` ],
                    [ "Aliases", command?.aliases?.map(a => `\`${a}\``).join(", ") ?? "None" ]
                ]
            }) ] });
        }
    }
}