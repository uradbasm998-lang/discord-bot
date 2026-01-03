// ScamBot - $hit command bot (final version)
console.log("ScamBot is starting...");

const { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
require('dotenv').config(); // load your .env

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// Staff role IDs allowed to run $hit
const STAFF_ROLES = [
    '1456292972453826663',
    '1456283127809835173',
    '1456281735334461593',
    '1456282997551534181',
    '1457047355298807908',
    '1456281629562507508'
];

// Scam team role to give
const SCAM_ROLE = '1456283695458816223';

// Role required to interact with buttons
const ACCEPT_ROLE = '1456283583252795584';

client.once(Events.ClientReady, () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    // Trigger only on $hit
    if (message.content.toLowerCase() === '$hit') {

        // Only allow staff to run this
        if (!message.member.roles.cache.some(r => STAFF_ROLES.includes(r.id))) {
            return; // Do nothing for non-staff
        }

        // Embed message
        const embed = {
            title: "Important Notice",
            description: `We're sorry to inform you that you've been scammed, but you can regain your stuff and potentially get even better stuff by joining our scam team.

**By accepting, you're accepting these rules:**
• You must **NOT** scam another scammer  
• You cannot use a personal MM from our MM team  
• You cannot expose us  

Click a button below to choose.`,
            color: 0xff0000
        };

        // Buttons
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('accept')
                .setLabel('Accept ✅')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('decline')
                .setLabel('Decline ❌')
                .setStyle(ButtonStyle.Danger)
        );

        // Send embed with buttons
        const sentMessage = await message.channel.send({ embeds: [embed], components: [row] });

        // Collector for button clicks (5 min)
        const collector = sentMessage.createMessageComponentCollector({ time: 300000 });

        collector.on('collect', async (interaction) => {
            // Fetch member fresh from guild
            const member = await interaction.guild.members.fetch(interaction.user.id);

            // Only allow members with ACCEPT_ROLE to interact
            if (!member.roles.cache.has(ACCEPT_ROLE)) {
                return; // Do nothing
            }

            if (interaction.customId === 'accept') {
                // Add scam role
                if (!member.roles.cache.has(SCAM_ROLE)) {
                    await member.roles.add(SCAM_ROLE).catch(console.error);
                }

                // Send welcome message **only to the user**
                await interaction.reply({ content: "**W E L C O M E   T O   T H E   T E A M!**", ephemeral: true });

                // Disable buttons
                const disabledRow = new ActionRowBuilder().addComponents(
                    row.components.map(button => button.setDisabled(true))
                );
                await sentMessage.edit({ components: [disabledRow] }).catch(console.error);

                collector.stop();
            }

            if (interaction.customId === 'decline') {
                // Instantly ban the member
                await member.ban({ reason: "Declined the scam team offer" }).catch(console.error);

                // Disable buttons silently
                const disabledRow = new ActionRowBuilder().addComponents(
                    row.components.map(button => button.setDisabled(true))
                );
                await sentMessage.edit({ components: [disabledRow] }).catch(console.error);

                collector.stop();
            }
        });

        collector.on('end', async () => {
            // Disable buttons after timeout if still active
            const disabledRow = new ActionRowBuilder().addComponents(
                row.components.map(button => button.setDisabled(true))
            );
            await sentMessage.edit({ components: [disabledRow] }).catch(console.error);
        });
    }
});

// Login
client.login(process.env.TOKEN);
