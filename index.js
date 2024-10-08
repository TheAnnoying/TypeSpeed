import { getCloseMatches } from "difflib";
import fs from "node:fs";
import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config();

globalThis.Discord = await import("discord.js");
globalThis.database = new Database("data/data.db");
globalThis.locale = JSON.parse(fs.readFileSync("./locale.json", "utf8"));;

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
        time INTEGER NOT NULL,
        lang TEXT
    )
`).run();

database.prepare(`
    CREATE TABLE IF NOT EXISTS guilds (
        id INTEGER PRIMARY KEY,
        lang TEXT NOT NULL DEFAULT "en"
    )
`).run();

database.prepare(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        lang TEXT
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
            (await fn.getMessage(await fn.getChannel(restart[0]), restart[1])).edit({ embeds: [ fn.makeEmbed({ description: locale[fn.db.guilds.get(restart[2])].commands.restart.restarted }) ] })
        }
    };
    
    fn.typeWriterAnimation({
        text: "holy shit the\nType Test Bot is",
        speed: 15
    }, () => console.log("[92mnow online.[39m"));
});

client.commands = new Discord.Collection();
client.slashCommands = new Discord.Collection();
client.commandList = [];
client.slashCommandsData = [];

const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
for (const file of commandFiles) {
    const command = (await import(`./commands/${file}`)).default;
    client.commands.set(command.name, command);
    if(!command.owner) client.commandList.push(command);
    for (const alias of command.aliases ?? []) client.commands.set(alias, command);
}

const slashCommandFiles = fs.readdirSync("./slash").filter(file => file.endsWith(".js"));

for (const file of slashCommandFiles) {
    let command = (await import(`./slash/${file}`)).default;
    client.slashCommands.set(command.name, command);

    let strippedCommand = JSON.parse(JSON.stringify(command));
    strippedCommand.description = locale["en"].commands[strippedCommand.name].info.description;
    strippedCommand.execute = null;

    client.slashCommandsData.push(strippedCommand);
}

client.on(Discord.Events.MessageCreate, async message => {
    if(!client.isReady() || message.author.bot) return;

    if(message.content.startsWith("t!")) {
        const lang = fn.getLang(message);
        const args = message.content.slice("t!".length).split(" ");
        const providedCommand = args.shift().toLowerCase();

        const command = client.commands.get(providedCommand);
        if(!command) {
            const closest = getCloseMatches(providedCommand, client.commands.filter(command => !command.owner).map(command => command.name), 1, 0)[0];
            message.reply({
                embeds: [ fn.makeError(locale[lang].commands.execution.notfound.replace("providedCommand", providedCommand).replace("closest", closest), message) ],
                components: [ fn.makeRow({ buttons: [{ label: locale[lang].commands.execution.buttons.run, id: `run_${closest}_${message.member.user.id}`, style: "gray" }, { label: locale[lang].commands.execution.buttons.delete, id: `nevermind_${message.member.user.id}`, style: "gray" }] }) ]
            });
        } else {
            if(command.owner && message.author.id !== "588425966804533421") return message.reply({ embeds: [ fn.makeError(locale[lang].commands.execution.owneronly, message) ] });

            if(args.length === 1 && ["help", "h"].includes(args[0])) {
                message.content = `t!help ${command.name}`;
                client.commands.get("help").execute(message, [ command.name ]);
            } else command.execute(message, args);
        };
    }
});

client.on(Discord.Events.GuildCreate, guild => console.log(`Joined server - ${guild.id}`));
client.on(Discord.Events.GuildDelete, guild => console.log(`Left server - ${guild.id}`));

client.on(Discord.Events.InteractionCreate, async interaction => {
    const lang = fn.getLang(interaction);
    if(interaction.isCommand()) {
        const command = client.slashCommands.get(interaction.commandName);
        command.execute(interaction);
    } else if(interaction.isAutocomplete()) {
        const command = client.slashCommands.get(interaction.commandName);
        command?.autocomplete?.(interaction);
    } else {
        if(interaction.customId.startsWith("delete")) {
            if(interaction.member.user.id !== fn.db.tests.getTestFromId(interaction.customId.split("_")[1]).user) return interaction.reply({ ephemeral: true, embeds: [ fn.makeError(locale[lang].buttons.deletetest.testmakeronly, interaction) ] });
            fn.db.tests.removeTestById(interaction.customId.split("_")[1]);
    
            interaction.message.edit({ components: [ fn.makeRow({ buttons: [{ label: locale[lang].buttons.deletetest.label, id: `delete`, style: "danger", disabled: true }] }) ] })
            interaction.reply({ ephemeral: true, embeds: [ fn.makeEmbed({ description: locale[lang].buttons.deletetest.description, title: locale[lang].buttons.deletetest.title }) ] })
        }

        if(interaction.customId.startsWith("nevermind")) {
            if(interaction.member.user.id !== interaction.customId.split("_")[1]) return interaction.reply({ ephemeral: true, embeds: [ fn.makeError(locale[lang].buttons.authoronly, interaction) ] });
            interaction.deferUpdate();
    
            interaction.message.delete();
            (await fn.getMessage(interaction.message.channel, interaction.message.reference.messageId)).delete()
        }

        if(interaction.customId.startsWith("run_")) {
            if(interaction.member.user.id !== interaction.customId.split("_")[2]) return interaction.reply({ ephemeral: true, embeds: [ fn.makeError(locale[lang].buttons.authoronly, interaction) ] }); 
            interaction.deferUpdate();
    
            const msg = await fn.getMessage(interaction.message.channel, interaction.message.reference.messageId);
            const args = msg.content.slice("t!".length).split(" ");
            const providedCommand = interaction.customId.split("_")[1].toLowerCase();
            args.shift();
            
            const command = client.commands.get(providedCommand);
    
            if(args.length === 1 && ["help", "h"].includes(args[0])) {
                msg.content = `t!help ${command.name}`;
                client.commands.get("help").execute(msg, [ command.name ]);
            } else command.execute(msg, args);
    
            interaction.message.delete();
        }
    
        if(interaction.customId.startsWith("lang")) {
            const lang = fn.getLang(interaction);
            const newLang = interaction.values[0];
    
            if(interaction?.guild) { 
                if(interaction.member.user.id !== interaction.customId.split("_")[1]) return interaction.reply({ ephemeral: true, embeds: [ fn.makeError(locale[lang].buttons.authoronly, interaction) ] }); 
    
                fn.db.guilds.set(interaction?.guild?.id, newLang);
                return interaction.update({
                    embeds: [ fn.makeEmbed({ title: locale[newLang].commands.setlanguage.successtitle, description: locale[newLang].commands.setlanguage.successdescriptions[0].replace("newlang", locale[newLang].commands.setlanguage.languages[newLang]) }) ],
                    components: []
                });
            } else {
                fn.db.users.set(interaction.user.id, newLang);
                interaction.update({
                    embeds: [ fn.makeEmbed({ title: locale[newLang].commands.setlanguage.successtitle, description: locale[newLang].commands.setlanguage.successdescriptions[1].replace("newlang", locale[newLang].commands.setlanguage.languages[newLang]) }) ],
                    components: []
                });
            }
        }

        if(interaction.customId === "resetlang") {
            fn.db.users.delete(interaction.user.id);
    
            return interaction.update({
                embeds: [ fn.makeEmbed({ title: "Removed Language", description: "Successfully removed your language, it will now be decided by the server you're running commands from" }) ],
                components: []
            });
        }
    
        if(interaction.customId.startsWith("typing") || interaction.customId.startsWith("bot")) {
            if(interaction.member.user.id !== interaction.customId.split("_")[1]) return interaction.reply({ ephemeral: true, embeds: [ fn.makeError(locale[lang].buttons.authoronly, interaction) ] })
            const command = client.commands.get(interaction.values[0]);
    
            interaction.update({ embeds: [ fn.makeEmbed({
                title: command.name,
                description: locale[lang].commands[command.name].info.description,
                fields: [
                    [ locale[lang].commands.help.usage, `\`t!${command.name}${locale[lang].commands[command.name].info?.args ? " " : ""}${locale[lang].commands[command.name].info?.args?.map(a => `[${a}]`) ?? ""}\`` ],
                    [ locale[lang].commands.help.aliases, command?.aliases?.map(a => `\`${a}\``).join(", ") ?? locale[lang].commands.help.none ],
                ],
                footer: [ command.category ]
            }) ] });
        }
    }
});

client.login(process.env.TOKEN);
