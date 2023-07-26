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
    console.log("on the line!");
});

client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
for (const file of commandFiles) {
    const command = (await import(`./commands/${file}`)).default;
    client.commands.set(command.name, command);
}

globalThis.words = [ "the", "be", "of", "and", "a", "to", "in", "he", "have", "it", "that", "for", "they", "I", "with", "as", "not", "on", "she", "at", "by", "this", "we", "you", "do", "but", "from", "or", "which", "one", "would", "all", "will", "there", "say", "who", "make", "when", "can", "more", "if", "no", "man", "out", "other", "so", "what", "time", "up", "go", "about", "than", "into", "could", "state", "only", "new", "year", "some", "take", "come", "these", "know", "see", "use", "get", "like", "then", "first", "any", "work", "now", "may", "such", "give", "over", "think", "most", "even", "find", "day", "also", "after", "way", "many", "must", "look", "before", "great", "back", "through", "long", "where", "much", "should", "well", "people", "down", "own", "just", "because", "good", "each", "those", "feel", "seem", "how", "high", "too", "place", "little", "world", "very", "still", "nation", "hand", "old", "life", "tell", "write", "become", "here", "show", "house", "both", "between", "need", "mean", "call", "develop", "under", "last", "right", "move", "thing", "general", "school", "never", "same", "another", "begin", "while", "number", "part", "turn", "real", "leave", "might", "want", "point", "form", "off", "child", "few", "small", "since", "against", "ask", "late", "home", "interest", "large", "person", "end", "open", "public", "follow", "during", "present", "without", "again", "hold", "govern", "around", "possible", "head", "consider", "word", "program", "problem", "however", "lead", "system", "set", "order", "eye", "plan", "run", "keep", "face", "fact", "group", "play", "stand", "increase", "early", "course", "change", "help", "line" ];

client.on(Discord.Events.MessageCreate, async message => {
    if(!client.isReady() || message.author.bot) return;

    if(message.content.startsWith("t!")) {
        const args = message.content.slice("t!".length).split(" ");
        const providedCommand = args.shift().toLowerCase();
        
        const command = client.commands.get(providedCommand) ?? client.commands.find(c => c.aliases.includes(providedCommand));
        if(!command) {
            const closest = getCloseMatches(providedCommand, client.commands.map(command => command.name), 1, 0)[0];
            message.reply({
                embeds: [ fn.makeError(`The command \`${providedCommand}\` was not found. Did you mean \`${closest}\`?`) ],
                components: [ fn.makeRow({ buttons: [{ label: "Run", id: `run_${closest}`, style: "gray" }, { label: "Delete", id: "nevermind", style: "gray" }] }) ]
            });
        } else command.execute(message, args, client);
    }
});

client.on(Discord.Events.InteractionCreate, async interaction => {
    if(interaction.customId === "delete") {
        fn.db.tests.removeTestById(interaction.message.embeds[0].footer.text.split("  •")[0].replace("ID: ", ""));

        interaction.message.edit({ components: [ fn.makeRow({ buttons: [{ label: "delete", id: "delete", style: "danger", disabled: true }] }) ] })
        interaction.reply({ ephemeral: true, embeds: [ fn.makeEmbed({ description: "deleted test from profile", title: "test deleted" }) ] })
    }
    if(interaction.customId === "nevermind") {
        interaction.deferUpdate();

        interaction.message.delete();
        (await fn.getMessage(interaction.message.channel, interaction.message.reference.messageId)).delete()
    }
    if(interaction.customId.startsWith("run_")) {
        interaction.deferUpdate();

        const msg = await fn.getMessage(interaction.message.channel, interaction.message.reference.messageId);
        const args = msg.content.slice("t!".length).split(" ");
        const providedCommand = interaction.customId.split("_")[1].toLowerCase();
        args.shift();
        
        const command = client.commands.get(providedCommand) ?? client.commands.find(c => c.aliases.includes(providedCommand));
        command.execute(msg, args, client);
        interaction.message.delete();
    }
});

client.login("MTEwNjkxNDY2NTM2MTA1NTkxNA.GOOqFp.7wUkbP49bDqOSTpt4CHVWclPdEU0ZBc_FSFPVY");