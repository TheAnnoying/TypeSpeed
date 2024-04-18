import { drawText } from "skia-canvas-draw-text";
import { Canvas } from "skia-canvas";
import levenshtein from "fast-levenshtein";
import ms from "ms";

export default {
    name: "typetest",
    options: [{
        name: "word-count",
        description: "The typing test's word count",
        min_value: 10,
        max_value: 50,
        type: 4
    }],
    async execute(interaction) {
        const lang = fn.getLang(interaction);
        let newWords = [];
        const wordCount = interaction.options.getInteger("word-count");
    
        fn.loop(wordCount ? wordCount : 30, i => {
            let randomWord = fn.randomElement(locale[lang].words);

            while(newWords[i-1] == randomWord) randomWord = fn.randomElement(locale[lang].words);
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

        await interaction.reply({ embeds: [ fn.makeEmbed({ thumbnail: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3pzZWk0bTExc3RmZWwwOGFlZnhydHhiOXB6ZzhqdG5oeGU2bDg0eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/RiEW6mSQqjRiDy51MI/giphy.gif" }) ] });

        await fn.sleep(3500);
        await interaction.editReply({
            embeds: [],
            files: [
                new Discord.AttachmentBuilder(await canvas.png, {
                    name: "typetest.png",
                    width: canvas.width,
                    height: canvas.height
                })
            ],
        });

        const currentTime = Date.now();
        const collector = interaction.channel.createMessageCollector({ 
            filter: (m => m.author.id == interaction.member.user.id), 
            time: 120_000,
            max: 1
        });

        collector.on("collect", m => {
            let timeTook = Date.now() - currentTime;

            const grossWPM = (m.content.length/5)/(timeTook/60000);
            const mistakeAmount = levenshtein.get(newWords.join(" "), m.content);
            const netWPM = grossWPM - mistakeAmount;
            const accuracy = parseInt((((newWords.join(" ").length-mistakeAmount)/newWords.join(" ").length)*100).toFixed(0))

            let valid = true;
            let testID;

            const embed = fn.makeEmbed({
                title: locale[lang].commands.typetest.title,
                description: locale[lang].commands.typetest.description,
            });

            if(netWPM >= 250) { embed.setFooter({ text: locale[lang].commands.typetest.cheated }); valid = false; }
            if(accuracy <= 50) { embed.setFooter({ text: locale[lang].commands.typetest.lowaccuracy }); valid = false; }
            if(netWPM < 10) { embed.setFooter({ text: locale[lang].commands.typetest.lowwpm }); valid = false; };

            if(valid) {
                testID = fn.db.tests.add(interaction.member.user.id, netWPM, grossWPM, mistakeAmount, timeTook, accuracy, lang);
                embed.setFooter({ text: `ID: ${testID.toString()}` });
                if(newWords.length <= 15) embed.setFooter({ text: `${testID}  •  ${locale[lang].commands.typetest.disclaimer}` });
            }
        
            m.reply({ embeds: [ embed.addFields(
                { name: "WPM", value: `${(netWPM.toFixed(0))}${grossWPM.toFixed(0) === netWPM.toFixed(0) ? "" : ` (${locale[lang].commands.typetest.raw}: ${grossWPM.toFixed(0)})`}` },
                { name: locale[lang].commands.typetest.timetook, value: ms(timeTook), inline: true },
                { name: locale[lang].commands.typetest.accuracy, value: `${accuracy}%${accuracy === 100 ? "" : ` (${mistakeAmount} ${mistakeAmount === 1 ? locale[lang].commands.typetest.mistake : locale[lang].commands.typetest.mistakes})`}`, inline: true }
            ) ], components: [ fn.makeRow({ buttons: [{ label: locale[lang].buttons.deletetest.label, id: `delete_${testID}`, style: "danger", disabled: valid ? false : true }] })] });
        });

        collector.on("end", collected => {
            if(collected.size === 0) interaction.editReply({ ephemeral: true, embeds: [ fn.makeError(locale[lang].commands.typetest.timedout, interaction) ], files: [], components: [] });
        });
    }
}