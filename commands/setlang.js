export default {
    name: "setlang",
    category: "bot",
    owner: true,
    aliases: [ "language" ],
    async execute(message, args) {
        fn.db.guilds.set(message.guild.id, "he")
    }
}