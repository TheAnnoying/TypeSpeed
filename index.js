import { getCloseMatches } from "difflib";
import fs from "node:fs";
import Database from "better-sqlite3";

globalThis.Discord = await import("discord.js");
globalThis.database = new Database("data/data.db");

database.pragma("journal_mode = WAL");
database.prepare(`
    CREATE TABLE IF NOT EXISTS tests (
        id INTEGER PRIMARY KEY,
        user TEXT NOT NULL,
        wpm INTEGER NOT NULL,
        grosswpm INTEGER NOT NULL,
        mistakes INTEGER NOT NULL,
        timetook FLOAT NOT NULL,
        accuracy INTEGER NOT NULL,
        time INTEGER NOT NULL
    )
`).run();

globalThis.fn = (await import("./functions.js")).default;

globalThis.client = new Discord.Client({
    intents: [
        "Guilds",
        "GuildMessages",
        "MessageContent",
        "GuildMembers",
        "DirectMessages"
    ].map(e => Discord.GatewayIntentBits[e]),
    partials: [
        "Channel"
    ].map(e => Discord.Partials[e]),
    presence: {
        status: Discord.PresenceUpdateStatus.Online,
        activities: [{ name: "you type", type: Discord.ActivityType.Watching }]
    },
    allowedMentions: { repliedUser: false }
});

client.once(Discord.Events.ClientReady, async () => {
    if(fs.existsSync("./data/restart.json")) {
        const restart = JSON.parse(fs.readFileSync("./data/restart.json", "utf8"));
        if(restart[0] && restart[1]) {
            (await fn.getMessage(await fn.getChannel(restart[0]), restart[1])).edit({ embeds: [ fn.makeEmbed({ description: "Restarted successfully" }) ] })
        }
    };

    fn.typeWriterAnimation({
        text: "holy shit the\nType Test Bot is",
        speed: 15
    }, () => console.log("[92mnow online.[39m"));
});

client.commands = new Discord.Collection();
client.commandList = [];

const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
for (const file of commandFiles) {
    const command = (await import(`./commands/${file}`)).default;
    client.commands.set(command.name, command);
    if(!command.owner) client.commandList.push(command);
    for (const alias of command.aliases ?? []) client.commands.set(alias, command);
}

globalThis.words = [ "the", "be", "of", "and", "a", "to", "in", "he", "have", "it", "that", "for", "they", "I", "with", "as", "not", "on", "she", "at", "by", "this", "we", "you", "do", "but", "from", "or", "which", "one", "would", "all", "will", "there", "say", "who", "make", "when", "can", "more", "if", "no", "man", "out", "other", "so", "what", "time", "up", "go", "about", "than", "into", "could", "state", "only", "new", "year", "some", "take", "come", "these", "know", "see", "use", "get", "like", "then", "first", "any", "work", "now", "may", "such", "give", "over", "think", "most", "even", "find", "day", "also", "after", "way", "many", "must", "look", "before", "great", "back", "through", "long", "where", "much", "should", "well", "people", "down", "own", "just", "because", "good", "each", "those", "feel", "seem", "how", "high", "too", "place", "little", "world", "very", "still", "nation", "hand", "old", "life", "tell", "write", "become", "here", "show", "house", "both", "between", "need", "mean", "call", "develop", "under", "last", "right", "move", "thing", "general", "school", "never", "same", "another", "begin", "while", "number", "part", "turn", "real", "leave", "might", "want", "point", "form", "off", "child", "few", "small", "since", "against", "ask", "late", "home", "interest", "large", "person", "end", "open", "public", "follow", "during", "present", "without", "again", "hold", "govern", "around", "possible", "head", "consider", "word", "program", "problem", "however", "lead", "system", "set", "order", "eye", "plan", "run", "keep", "face", "fact", "group", "play", "stand", "increase", "early", "course", "change", "help", "line" ];

client.on(Discord.Events.MessageCreate, async message => {
    if(!client.isReady() || message.author.bot) return;

    if(message.content.startsWith("t!")) {
        const args = message.content.slice("t!".length).split(" ");
        const providedCommand = args.shift().toLowerCase();
        
        const command = client.commands.get(providedCommand);
        if(!command) {
            const closest = getCloseMatches(providedCommand, client.commands.filter(command => !command.owner).map(command => command.name), 1, 0)[0];
            message.reply({
                embeds: [ fn.makeError(`The command \`${providedCommand}\` was not found. Did you mean \`${closest}\`?`) ],
                components: [ fn.makeRow({ buttons: [{ label: "Run", id: `run_${closest}_${message.member.user.id}`, style: "gray" }, { label: "Delete", id: `nevermind_${message.member.user.id}`, style: "gray" }] }) ]
            });
        } else {
            if(command.owner) {
                await client.application.fetch();
                if(message.author.id !== client.application.owner.id) return message.reply({ embeds: [ fn.makeError("This command can only be used by the bot's owner") ] });
            }
            command.execute(message, args);
        };
    }
});

client.on(Discord.Events.InteractionCreate, async interaction => {
    if(interaction.customId.startsWith("delete")) {
        if(interaction.member.user.id !== interaction.customId.split("_")[1]) return interaction.reply({ ephemeral: true, embeds: [ fn.makeError("This button can only be used by the original author") ] });
        fn.db.tests.removeTestById(interaction.customId.split("_")[2]);

        interaction.message.edit({ components: [ fn.makeRow({ buttons: [{ label: "Delete Test", id: `delete`, style: "danger", disabled: true }] }) ] })
        interaction.reply({ ephemeral: true, embeds: [ fn.makeEmbed({ description: "Deleted test from profile", title: "Test Deleted" }) ] })
    }
    if(interaction.customId === "nevermind") {
        if(interaction.member.user.id !== interaction.customId.split("_")[1]) return interaction.reply({ ephemeral: true, embeds: [ fn.makeError("This button can only be used by the original author") ] });
        interaction.deferUpdate();

        interaction.message.delete();
        (await fn.getMessage(interaction.message.channel, interaction.message.reference.messageId)).delete()
    }
    if(interaction.customId.startsWith("run_")) {
        if(interaction.member.user.id !== interaction.customId.split("_")[2]) return interaction.reply({ ephemeral: true, embeds: [ fn.makeError("This button can only be used by the original author") ] }); 
        interaction.deferUpdate();

        const msg = await fn.getMessage(interaction.message.channel, interaction.message.reference.messageId);
        const args = msg.content.slice("t!".length).split(" ");
        const providedCommand = interaction.customId.split("_")[1].toLowerCase();
        args.shift();
        
        const command = client.commands.get(providedCommand);

        command.execute(msg, args, client);
        interaction.message.delete();
    }

    if(["typetest", "bot"].includes(interaction.customId)) {
        const command = client.commands.get(interaction.values[0]);
        interaction.update({ embeds: [ fn.makeEmbed({
            title: command.name,
            description: command.description,
            fields: [
                [ "Usage", `\`t!${command.name}${command?.args ? " " : ""}${command?.args?.map(a => `[${a}]`)}\`` ],
                [ "Aliases", command?.aliases?.map(a => `\`${a}\``).join(", ") ?? "None" ],
            ],
            footer: [ command.category ]
        }) ] });
    }
});

client.login("MTEwNjkxNDY2NTM2MTA1NTkxNA.GOOqFp.7wUkbP49bDqOSTpt4CHVWclPdEU0ZBc_FSFPVY");