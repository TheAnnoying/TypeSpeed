export default {
    name: "ping",
    category: "bot",
    async execute(message) {
        const lang = fn.getLang(message);

        const before = Date.now();
        const ping = await message.reply({ embeds: [ fn.makeEmbed({
            title: locale[lang].commands.ping.titles[0],
            field: [ locale[lang].commands.ping.fields[0], `${client.ws.ping}ms` ],
        }) ], fetchReply: true });

        ping.edit({ embeds: [ fn.makeEmbed({
            title: locale[lang].commands.ping.titles[1],
            fields: [
                [ locale[lang].commands.ping.fields[0], `${client.ws.ping}ms` ],
                [ locale[lang].commands.ping.fields[1], `${Date.now() - before}ms` ]
            ]
        }) ] });
    }
}