import ms from "ms";

export default {
    name: "gettest",
    aliases: [ "getest", "findtest", "gt" ],
    async execute(message, args) {
        const providedId = parseFloat(args[0]);
        
        if(!providedId) return message.reply({ embeds: [ fn.makeError("You must provide a test ID") ] });
        if(providedId <= 0) return message.reply({ embeds: [ fn.makeError("You must provide a positive number that isn't 0") ] });
        if(providedId % 1 !== 0) return message.reply({ embeds: [ fn.makeError("You must provide a whole number") ] });

        const test = fn.db.tests.getTestFromId(providedId);
        if(!test) return message.reply({ embeds: [ fn.makeError(`The ID \`${providedId}\` does not belong to any test`) ] })
        const user = await fn.getUser(test.user);

        message.reply({ embeds: [
            fn.makeEmbed({
                author: [ user.username, user.displayAvatarURL({ dynamic: true }) ],
                fields: [
                    [ "WPM", `${test.wpm}${test.grosswpm === test.wpm ? "" : ` (raw: ${test.grosswpm})`}` ],
                    [ "Time Took", ms(test.timetook), true ],
                    [ "Accuracy", `${test.accuracy}%${test.accuracy === 100 ? "" : ` (${test.mistakes} mistake${test.mistakes === 1 ? "" : "s"})`}`, true ]
                ],
                footer: [ `ID: ${test.id.toString()}` ],
                timestamp: test.time
            })
        ], components: [ fn.makeRow({ buttons: [{ label: "Delete", id: "delete", style: "danger" }] }) ] });
    }
}