export default {
    name: "deploy",
    owner: true,
    aliases: [ "dep" ],
    async execute(message, args) {
        const lang = fn.getLang(message);

        const rest = new Discord.REST({ version: "10" }).setToken(process.env.TOKEN);
        const res = await message.reply({ embeds: [ fn.makeEmbed({ description: locale[lang].commands.deploy.deploying }) ] });

        await rest.put(Discord.Routes.applicationCommands(client.user.id), { body: client.slashCommandsData });
        res.edit({ embeds: [ fn.makeEmbed({ description: locale[lang].commands.deploy.success }) ] });
    }
}