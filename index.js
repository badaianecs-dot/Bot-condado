const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  SlashCommandBuilder,
  REST,
  Routes,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  InteractionResponseFlags,
} = require("discord.js");
require("dotenv").config();
const express = require("express");

// ---------------- CLIENTE ----------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

// ---------------- CONFIGURAÇÕES ----------------
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_IDS = process.env.GUILD_ID.split(","); // se tiver mais de uma guild
const COLOR_PADRAO = "#f6b21b";
const STREAMER_ROLE = "1150955061606895737";
const STAFF_ROLES = [
  "1136127586737590412",
  "1181617285530660904",
  "1123014410496118784",
  "1197207305968701521",
];
const CIDADAO_ROLE = "1136132647115030608";

// ---------------- COMANDOS ----------------
const commands = [
  new SlashCommandBuilder()
    .setName("teste")
    .setDescription("Comando de teste"),
  new SlashCommandBuilder()
    .setName("entrevista")
    .setDescription("📌 Envia mensagem de aguarde entrevista"),
  // outros comandos que você já tinha podem ser adicionados aqui
].map((cmd) => cmd.toJSON());

// ---------------- REGISTRAR COMANDOS ----------------
client.once("clientReady", async () => {
  console.log(`🤖 Bot online como ${client.user.tag}`);
  const rest = new REST({ version: "10" }).setToken(TOKEN);

  try {
    for (const guildId of GUILD_IDS) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guildId), {
        body: commands,
      });
    }
    console.log("✅ Comandos registrados apenas nas guilds permitidas!");
  } catch (err) {
    console.error("❌ Erro ao registrar comandos:", err);
  }
});

// ---------------- INTERAÇÕES ----------------
client.on("interactionCreate", async (interaction) => {
  try {
    if (!interaction.isChatInputCommand()) return;
    const commandName = interaction.commandName;
    const temPermissao = STAFF_ROLES.some((r) =>
      interaction.member.roles.cache.has(r)
    );

    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ flags: InteractionResponseFlags.Ephemeral });
    }

    // ------------- /teste -------------
    if (commandName === "teste") {
      return interaction.editReply({ content: "✅ Bot funcionando!" });
    }

    // ------------- /entrevista -------------
    if (commandName === "entrevista") {
      const embed = new EmbedBuilder()
        .setColor(COLOR_PADRAO)
        .setTitle("Olá, visitantes!")
        .setDescription(
          "As entrevistas já estão disponíveis. Para participar, clique no botão abaixo e um membro da equipe irá atendê-lo em breve.\n\nDesejamos boa sorte!"
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Aguarde Entrevista")
          .setStyle(ButtonStyle.Link)
          .setURL("https://discord.com/channels/1120401688713502772/1179115356854439966")
      );

      await interaction.channel.send({ embeds: [embed], components: [row] });
      await interaction.channel.send({ content: `<@&1136131478888124526>` });
      return interaction.editReply({ content: "✅ Mensagem de entrevista enviada!" });
    }
  } catch (err) {
    console.error("Erro em interactionCreate:", err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "❌ Ocorreu um erro.",
        flags: InteractionResponseFlags.Ephemeral,
      });
    } else {
      await interaction.followUp({
        content: "❌ Ocorreu um erro.",
        flags: InteractionResponseFlags.Ephemeral,
      });
    }
  }
});

// ---------------- EXPRESS ----------------
const app = express();
app.get("/", (req, res) => res.send("Bot está rodando e acordado! ✅"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🌐 Servidor web ativo para manter o bot acordado!"));

// ---------------- LOGIN ----------------
client.login(TOKEN);
