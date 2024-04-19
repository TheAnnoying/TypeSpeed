export default {
    name: "ping",
    async execute(interaction) {
        const lang = fn.getLang(interaction);

        const before = Date.now();
        await interaction.reply({ embeds: [ fn.makeEmbed({
            title: locale[lang].commands.ping.titles[0],
            field: [ locale[lang].commands.ping.fields[0], `${client.ws.ping}ms` ],
        }) ], fetchReply: true });

        interaction.editReply({ embeds: [ fn.makeEmbed({
            title: locale[lang].commands.ping.titles[1],
            fields: [
                [ locale[lang].commands.ping.fields[0], `${client.ws.ping}ms` ],
                [ locale[lang].commands.ping.fields[1], `${Date.now() - before}ms` ]
            ]
        }) ] });
    }
}