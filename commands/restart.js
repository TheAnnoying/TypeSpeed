import fs from "node:fs";

export default {
    name: "restart",
    category: "bot",
    description: "Restart the bot",
    owner: true,
    aliases: [ "reboot", "end", "kill" ],
    async execute(message, args) {
        const msg = await message.reply({ embeds: [ fn.makeEmbed({ description: "Restarting..." }) ] });

        client.destroy();
        if(["reboot", "restart"].includes(message.content)) {
            fs.writeFileSync("./data/restart.json", JSON.stringify([msg.channel.id, msg.id]), "utf8");
        }
        process.exit();
    }
}