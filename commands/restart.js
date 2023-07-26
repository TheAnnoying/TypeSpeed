import fs from "node:fs";

export default {
    name: "restart",
    aliases: [ "reboot", "r" ],
    async execute(message, args, client) {
        await client.application.fetch();
        if(message.author.id !== client.application.owner.id) return message.reply({ embeds: [ fn.makeError("This command can only be used by the bot's owner") ] });

        const msg = await message.reply({ embeds: [ fn.makeEmbed({ description: "Restarting..." }) ] });

        client.destroy();
        fs.writeFileSync("./data/restart.json", JSON.stringify([msg.channel.id, msg.id]), "utf8");
        process.exit();
    }
}