import { Duplex } from "node:stream";
import { Console } from "node:console";

class ConsoleOutput extends Duplex {
    constructor(...args) {
        super(...args);
        this.output = "";
    }

    _write(e) { this.output += e; }
    _read() { return this.output; }
}

export default {
    name: "evaluate",
    owner: true,
    aliases: [ "eval" ],
    async execute(message, args) {
        const lang = fn.getLang(message);
        
        let text = args.join(" ");
        if(!text) return message.reply({ embeds: [ fn.makeError(locale[lang].commands.eval.youmustprovidecode, message) ] });

        text = text.replace(/^```(js|javascript)?|```$/g, "").trim();
        const evalOut = new ConsoleOutput()
        evalOut.setEncoding("utf8");
        const console3 = new Console({ stdout: evalOut });
        
        let out = "";
        try {
            const console = {
                log(...args) {
                    for (const [i, arg] of args.entries()) {
                        const evalOut2 = new ConsoleOutput();
                        const console2 = new Console({ stdout: evalOut2 });
                        console2.log(arg);
                        i > 0
                            ? out = out.slice(0, -1) + " " + evalOut2._read()
                            : out += evalOut2._read();
                    }
                }
            }

            console3.log(await eval(`(async () => {try {return await (async () => {${text.includes("return") || text.includes("console.log") ? text : "return " + text}})()} catch(err) {return err}})()`));

            if (text.includes("return") || !text.includes("console.log")) out += evalOut._read();
            out = out.trim().replaceAll("MTEwNjkxNDY2NTM2MTA1NTkxNA.GOOqFp.7wUkbP49bDqOSTpt4CHVWclPdEU0ZBc_FSFPVY", "TOKEN_REDACTED");
            if (out.length > 4086) {
                return message.reply({
                    files: [ new Discord.AttachmentBuilder(Buffer.from(out, "utf8"), { name: "eval.js" }) ]
                });
            }
            if (out === "null") return;
            message.reply({ embeds: [ fn.makeEmbed({ description: `\`\`\`js\n${out}\`\`\`` }) ] });
        } catch (err) {
            message.reply({ embeds: [ fn.makeEmbed({ description: `\`\`\`js\n${err.message.limit(4086)}\`\`\`` }) ] });
        }
    }
}