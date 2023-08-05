import Discord from "discord.js";

const sleep = (await import("node:timers/promises")).setTimeout;

String.prototype.limit = function(l = 128) {
    if (this.length <= l) return this
    return this.slice(0, l - 1) + "…";
}

const loop = (time, callback) => {
    for(let i = 0; i < time; i++) { callback(i); }
};

const randomElement = (array) => array[Math.floor(Math.random()*array.length)];

function prepareDBAction(action, run = "run", input = null, output = null) {
    const prep = database.prepare(action);
    if (output) return (...args) => {
        if (input) args = input(...args);
        return output(prep[run](...args));
    }
    else return (...args) => {
        if (input) args = input(...args);
        return prep[run](...args);
    }
}

function typeWriterAnimation(data = {}, callback) {
    let index = 0;
    const intervalId = setInterval(() => {
        process.stdout.write(data.text[index]);
        index++;
        if (index === data.text.length) {
            clearInterval(intervalId);
            process.stdout.write("\n");
            if (callback && typeof callback === "function") setTimeout(callback, 500);
        }
    }, data?.speed ?? 50);
}

const db = {
    tests: {
        add: prepareDBAction(`
            INSERT INTO tests (user, wpm, grosswpm, mistakes, timetook, accuracy, time, lang)
            VALUES (?, FLOOR(?), FLOOR(?), ?, ?, ?, strftime('%s', 'now')*1000, ?)
        `, "run", null, o => o.lastInsertRowid),
        getTestFromId: prepareDBAction(`
            SELECT *
            FROM tests
            WHERE id = ?
        `, "get"),
        getTestsFromUser: prepareDBAction(`
            SELECT COUNT(id) AS count, FLOOR(AVG(wpm)) AS average, MAX(time) AS latest, MAX(wpm) AS bestwpm
            FROM tests
            WHERE user = ?
        `, "get"),
        removeTestById: prepareDBAction(`
            DELETE FROM tests
            WHERE id = ?
        `)
    },
    guilds: {
        set: prepareDBAction(`
            INSERT INTO guilds (id, lang)
            VALUES (?, ?)
            ON CONFLICT (id) DO UPDATE
            SET lang = ?
            WHERE id = ?
        `, "run", (i, l) => [i, l, l, i]),
        get: prepareDBAction(`
            SELECT lang
            FROM guilds
            WHERE id = ?
        `, "get", null, o => o?.lang ?? "en")
    },
    users: {
        set: prepareDBAction(`
            INSERT INTO users (id, lang)
            VALUES (?, ?)
            ON CONFLICT (id) DO UPDATE
            SET lang = ?
            WHERE id = ?
        `, "run", (i, l) => [i, l, l, i]),
        get: prepareDBAction(`
            SELECT lang
            FROM users
            WHERE id = ?
        `, "get", null, o => o?.lang),
        delete: prepareDBAction(`
            DELETE FROM users
            WHERE id = ?
        `, "run")
    }
}

function getLang(message) {
    const userLang = db.users.get(message?.author?.id ?? message?.user?.id ?? message?.member?.user?.id);
    const guildLang = db.guilds.get(message?.guild?.id);

    if(userLang) {
        return userLang;
    } else return guildLang;
}

function makeError(description, message) {
    const lang = getLang(message);
    return makeEmbed({ color: "#dd403a", author: [ locale[lang].error, "https://theannoying.dev/assets/error.png" ], description })
}

async function get(thing, id) {
    if(!id || id.length > 19) return;
    const got = await thing?.fetch(id).catch(() => {})
    if(got instanceof Discord.Collection) return;
    return got;
};

const getChannel = async (id, guild) => get(guild?.channels ?? client.channels, id);
const getGuild = async id => get(client.guilds, id);
const getMember = async (guild, id) => get(guild.members, id);
const getMessage = async (channel, id) => get(channel.messages, id);
const getUser = async id => get(client.users, id);
const getRole = async (guild, id) => get(guild.roles, id);
const getGuildEmoji = async (guild, id) => get(guild.emojis, id);

function makeRow(data) {
    const row = new Discord.ActionRowBuilder();

    const styles = {
        "blurple": Discord.ButtonStyle.Primary,
        "gray": Discord.ButtonStyle.Secondary,
        "danger": Discord.ButtonStyle.Danger,
        "success": Discord.ButtonStyle.Success,
        "url": Discord.ButtonStyle.Link
    };

    if(data.buttons) {
        data.buttons.forEach(button => {
            const element = new Discord.ButtonBuilder().setLabel(button.label).setStyle(styles[button.style] ?? styles[0]);

            button.url ? element.setURL(button.url) : element.setCustomId(button.id ?? Math.floor(Math.random() * 10000));
            button.emoji ? element.setEmoji(button.emoji) : null;
            button.disabled ? element.setDisabled(true) : null;

            row.addComponents(element);
        });
    } else if(data.selectmenu) {
        const select = data.selectmenu;
        const element = new Discord.StringSelectMenuBuilder().setCustomId(select.id);
        if(select.placeholder) element.setPlaceholder(select.placeholder);

        select.min ? element.setMinValues(select.min) : null;
        select.max ? element.setMaxValues(select.max) : null;
        select.disabled ? element.setDisabled(true) : null;
        
        select.options.forEach(option => {
            const optionElement = new Discord.StringSelectMenuOptionBuilder().setLabel(option.name).setValue(option.value);
            
            option.description ? optionElement.setDescription(option.description) : null;
            option.emoji ? optionElement.setEmoji(option.emoji) : null;
            option.default ? optionElement.setDefault(option.default) : optionElement.setDefault(false);

            element.addOptions(optionElement);
        });

        row.addComponents(element);
    }

    return row;
}

async function memberArg(item, data) {
    if (item instanceof Discord.GuildMember) return item;
    if(!item) return createMember(data.message.author);
    item = item.toLowerCase();
    let member;

    if (item === "<<" && !data.noText) return createMember(data.message.author)
    if (["<", "me"].includes(item) && !data.noText && data.message.member) return createMember(data.message.author)
    if (item === "^" && !data.noText) try {
        const messages = Array.from(await data.message.channel.messages.fetch({before: data.message.id, limit: 1}))
        if (messages[0][1].member) return messages[0][1].member
    } catch {}
    try {
        const id = item.replace(/\D+/g, "");
        if(data.message.guild) {
            member = await getMember(data.message.guild, id);
            if(!member) {
                if(!data.noText) try {
                    const parts = item.match(/(.+?)(#\d{4}$)?$/);
                    const members = await data.message.guild.members.search({ query: parts[1] });
                    const found = members.find(member => member.user.username.toLowerCase() === item || member.nickname?.toLowerCase() === item || member.displayName.toLowerCase());
                    if(found) member = found;
                } catch {};
            }
        } else {
            let user;
            if (id === client.user.id || item === client.user.username) {
                user = client.user;
            } else if (id === data.message.author.id || item === data.message.author.username) {
                user = data.message.author;
            }
            if(user) member = createMember(user);
        }
        if (!member) {
            let user;
            try {
                user = await client.users.fetch(id);
            } catch {};
            if(user) member = createMember(user);
        }
    } catch {}
    if(!member && !data.errorless) return data.message.reply({ embeds: [ makeError(`The member \`${item.limit()}\` could not be found`) ] });
    return member;
}

function createMember(user) {
    const member = new Discord.GuildMember;
    member.user = user;
    Object.defineProperty(member, "displayName", {
        get: () => user.username
    })
    Object.defineProperty(member, "displayColor", {
        get: () => 0
    });
    return member;
}

function makeEmbed(data) {
    const embed = new Discord.EmbedBuilder();
    if (data.title) embed.setTitle(data.title);
    if (data.url) embed.setURL(data.url);
    if (data.description) embed.setDescription(data.description);
    if (data.author?.[0]) embed.setAuthor({ name: data.author[0], iconURL: data.author[1], url: data.author[2] });
    if (data.footer?.[0]) embed.setFooter({ text: data.footer[0], iconURL: data.footer[1] });
    if (data.thumbnail) embed.setThumbnail(data.thumbnail);
    if (data.image) embed.setImage(data.image);
    if (data.timestamp) embed.setTimestamp(data.timestamp);
    if (data.field) embed.addFields({ name: data.field[0], value: data.field[1], inline: data.field[2] });
    if (data.fields) embed.addFields(data.fields.map(e => ({ name: e[0], value: e[1], inline: e[2] ?? false })));
    embed.setColor(data.color ?? "#A0B8C0");
    return embed;
}

export default { getLang, typeWriterAnimation, sleep, db, makeEmbed, loop, randomElement, createMember, memberArg, getChannel, getGuild, getMember, getMessage, getUser, getRole, getGuildEmoji, makeRow, makeError };