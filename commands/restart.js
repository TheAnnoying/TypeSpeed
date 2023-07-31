import fs from "node:fs";

export default {
    name: "restart",
    category: "bot",
    owner: true,
    aliases: [ "reboot", "end", "kill" ],
    async execute(message, args) {
        const lang = fn.db.guilds.get(message.guild.id);
        const msg = await message.reply({ embeds: [ fn.makeEmbed({ description: locale[lang].commands.restart.restarting }) ] });

        client.destroy();
        fs.writeFileSync("./data/restart.json", JSON.stringify([msg.channel.id, msg.id, msg.guild.id]), "utf8");
        process.exit();
    }
}