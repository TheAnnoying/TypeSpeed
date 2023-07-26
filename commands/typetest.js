import { drawText } from "skia-canvas-draw-text";
import { Canvas } from "skia-canvas"
import levenshtein from "fast-levenshtein";
import ms from "ms";

export default {
    name: "typetest",
    aliases: [ "test", "starttest", "startest", "tt" ],
    async execute(message, args) {
        let newWords = [];
        const wordCount = parseInt(args[0]);

        if(wordCount < 0) return message.reply({ embeds: [ fn.makeError("The word count must be a positive number") ] });
        if(wordCount < 10) return message.reply({ embeds: [ fn.makeError("The word count must be greater than or equal to \`10\`") ] });
        if(wordCount >= 51) return message.reply({ embeds: [ fn.makeError("The word count must be less than or equal to 50") ] });
    
        fn.loop(wordCount ? wordCount : 30, i => {
            let randomWord = fn.randomElement(words);

            while(newWords[i-1] == randomWord) randomWord = fn.randomElement(words);
            newWords.push(randomWord);
        });

        const text = await drawText(newWords.join(" "), {
            fontSize: 15,
            width: 550 - 24,
            wrap: true,
            colour: "#A0B8C0",
            shadowColour: "#0008",
            shadowBlur: 3,
            shadowOffset: [0, 6],
            align: "center"
        });

        const canvas = new Canvas(text.width + 24, text.height + 24);
        const ctx = canvas.getContext("2d");

        ctx.fillStyle = "#242933";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(text, 12, 12);

        const testMessage = await message.reply({
            files: [
                new Discord.AttachmentBuilder(await canvas.png, {
                    name: "typetest.png",
                    width: canvas.width,
                    height: canvas.height
                })
            ],
        });

        const currentTime = new Date().getTime();
        const collector = message.channel.createMessageCollector({ 
            filter: (m => m.author.id == message.author.id), 
            time: 120_000,
            max: 1
        });

        collector.on("collect", m => {
            let timeTook = (new Date() - currentTime);

            const grossWPM = (m.content.length/5)/(timeTook/60000);
            const mistakeAmount = levenshtein.get(newWords.join(" "), m.content);
            const netWPM = grossWPM - mistakeAmount;
            const accuracy = parseInt((((newWords.join(" ").length-mistakeAmount)/newWords.join(" ").length)*100).toFixed(0))

            let valid = true;
            let testID;

            const embed = fn.makeEmbed({
                title: "Test Results",
                description: "Information about your recent type test",
            });

            if(netWPM >= 250) { embed.setFooter({ text: `The user probably cheated on this test` }); valid = false; }
            if(accuracy <= 50) { embed.setFooter({ text: `Invalid test - low accuracy` }); valid = false; }
            if(netWPM < 10) { embed.setFooter({ text: `Invalid test - low wpm`}); valid = false; };

            if(valid) testID = fn.db.tests.add(message.member.user.id, netWPM, grossWPM, mistakeAmount, timeTook, accuracy);

            embed.setFooter({ text: `ID: ${testID.toString()}` });
            if(newWords.length <= 15) embed.setFooter({ text: `${testID}  •  Low word counts may result in less accurate results` });
        
            m.reply({ embeds: [ embed.addFields(
                { name: "WPM", value: `${(netWPM.toFixed(0))}${grossWPM.toFixed(0) === netWPM.toFixed(0) ? "" : ` (raw: ${grossWPM.toFixed(0)})`}` },
                { name: "Time Took", value: ms(timeTook), inline: true },
                { name: "Accuracy", value: `${accuracy}%${accuracy === 100 ? "" : ` (${mistakeAmount} mistake${mistakeAmount === 1 ? "" : "s"})`}`, inline: true }
            ) ], components: [ fn.makeRow({ buttons: [{ label: "Delete", id: "delete", style: "danger", disabled: valid ? false : true }] })] });
        });

        collector.on("end", collected => {
            if(collected.size === 0) testMessage.edit({ embeds: [ fn.makeError("The test timed out") ], files: [], components: [] });
        });
    }
}