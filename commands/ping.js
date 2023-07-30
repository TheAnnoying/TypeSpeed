export default {
    name: "ping",
    category: "bot",
    description: "Check the ping",
    async execute(message, args) {
        const before = Date.now();
        const ping = await message.reply({ embeds: [ fn.makeEmbed({
            title: "Pinging...",
            field: [ "API Latency", `${client.ws.ping}ms` ],
        }) ], fetchReply: true });

        ping.edit({ embeds: [ fn.makeEmbed({
            title: "Ping Results",
            fields: [
                [ "API Latency", `${client.ws.ping}ms` ],
                [ "Bot Latency", `${Date.now() - before}ms` ]
            ]
        }) ] });
    }
}