const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  SlashCommandBuilder,
  REST,
  Routes,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
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
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_IDS = [process.env.GUILD_ID1, process.env.GUILD_ID2];

const COLOR_PADRAO = "#f6b21b";

const STREAMER_ROLE = "1150955061606895737";

const STAFF_ROLES = [
  "1136127586737590412",
  "1181617285530660904",
  "1123014410496118784",
  "1197207305968701521",
  "1207449146919882782"
];

const CIDADAO_ROLE = "1136132647115030608";

// ---------------- COMANDOS ----------------
const commands = [
  new SlashCommandBuilder()
    .setName("aprovado")
    .setDescription("✅ Aprovar um usuário")
    .addUserOption(opt =>
      opt.setName("usuario").setDescription("Usuário aprovado").setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("motivo").setDescription("Motivo da aprovação").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("reprovado")
    .setDescription("❌ Reprovar um usuário")
    .addUserOption(opt =>
      opt.setName("usuario").setDescription("Usuário reprovado").setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("motivo").setDescription("Motivo da reprovação").setRequired(true)
    ),
].map(cmd => cmd.toJSON());

// ---------------- REGISTRAR COMANDOS ----------------
client.once("clientReady", async () => {
  console.log(`🤖 Bot online como ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  try {
    for (const guildId of GUILD_IDS) {
      if (!guildId) continue;

      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, guildId),
        { body: commands }
      );

      console.log(`✅ Comandos registrados na guild ${guildId}`);
    }
  } catch (err) {
    console.error("❌ Erro ao registrar comandos:", err);
  }
});

// ---------------- INTERAÇÕES ----------------
client.on("interactionCreate", async interaction => {
  try {
    if (!interaction.isChatInputCommand()) return;

    const commandName = interaction.commandName;
    const temPermissao = STAFF_ROLES.some(r =>
      interaction.member.roles.cache.has(r)
    );

    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ ephemeral: true });
    }

    if (!temPermissao) {
      return interaction.editReply({
        content: "❌ Você não tem permissão para usar este comando."
      });
    }

    // ---------------- /aprovado ----------------
    if (commandName === "aprovado") {
      const usuario = interaction.options.getUser("usuario");
      const motivo = interaction.options.getString("motivo");

      const embed = new EmbedBuilder()
        .setColor("#00FF00")
        .setTitle("✅ Passaporte aprovado!")
        .setDescription(
          `Você foi liberado(a) para jogar em nossa cidade. Respeite todas as regras e tenha um bom jogo!\n\n` +
          `👤 **Usuário:** ${usuario}\n\n📝 **Motivo:** ${motivo}`
        )
        .setFooter({
          text: "Atenciosamente, Condado."
        });

      await interaction.channel.send({ embeds: [embed] });

      return interaction.editReply({
        content: "✅ Aprovação enviada!"
      });
    }

    // ---------------- /reprovado ----------------
    if (commandName === "reprovado") {
      const usuario = interaction.options.getUser("usuario");
      const motivo = interaction.options.getString("motivo");

      const embed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("❌ Passaporte reprovado!")
        .setDescription(
          `Infelizmente você foi reprovado(a). Leia as orientações e tente novamente quando estiver apto(a).\n\n` +
          `👤 **Usuário:** ${usuario}\n\n📝 **Motivo:** ${motivo}`
        )
        .setFooter({
          text: "Atenciosamente, Condado."
        });

      await interaction.channel.send({ embeds: [embed] });

      return interaction.editReply({
        content: "❌ Reprovação enviada!"
      });
    }

  } catch (err) {
    console.error("Erro em interactionCreate:", err);
  }
});

// ---------------- LOGIN ----------------
client.login(TOKEN);

// ---------------- SERVIDOR WEB PARA RENDER ----------------
const app = express();

app.get("/", (req, res) => {
  res.send("Bot Condado está online!");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🌐 Servidor web rodando na porta ${PORT}`);
});
