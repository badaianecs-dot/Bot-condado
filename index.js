const { 
  Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, 
  REST, Routes, ActionRowBuilder, ButtonBuilder, ButtonStyle 
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
const GUILD_IDS = [ process.env.GUILD_ID1, process.env.GUILD_ID2 ];
const COLOR_PADRAO = "#f6b21b";

const STREAMER_ROLE = "1150955061606895737";

const STAFF_ROLES = [
  "1136127586737590412",
  "1181617285530660904",
  "1123014410496118784",
  "1197207305968701521",
  "1207449146919882782"
];

// ---------------- COMANDOS ----------------
const commands = [
  new SlashCommandBuilder()
    .setName("aviso")
    .setDescription("📣 Enviar um aviso")
    .addStringOption(opt => opt.setName("titulo").setDescription("Título do aviso").setRequired(true))
    .addStringOption(opt => opt.setName("descricao").setDescription("Descrição do aviso (use \\n)").setRequired(true)),

  new SlashCommandBuilder()
    .setName("evento")
    .setDescription("📅 Criar um evento")
    .addStringOption(opt => opt.setName("titulo").setDescription("Título").setRequired(true))
    .addStringOption(opt => opt.setName("descricao").setDescription("Descrição").setRequired(true))
    .addStringOption(opt => opt.setName("data").setDescription("Data").setRequired(true))
    .addStringOption(opt => opt.setName("horario").setDescription("Horário").setRequired(true))
    .addStringOption(opt => opt.setName("local").setDescription("Local").setRequired(true))
    .addStringOption(opt => opt.setName("premiacao").setDescription("Premiação"))
    .addStringOption(opt => opt.setName("observacao").setDescription("Observação")),

  new SlashCommandBuilder()
    .setName("cargostreamer")
    .setDescription("Mensagem para pegar o cargo Streamer"),

  new SlashCommandBuilder()
    .setName("pix")
    .setDescription("💰 PIX Gabriel (STAFF)")
    .addStringOption(opt => opt.setName("valor").setDescription("Valor").setRequired(true))
    .addStringOption(opt => opt.setName("produto").setDescription("Produto").setRequired(true)),

  new SlashCommandBuilder()
    .setName("pix2")
    .setDescription("💰 PIX Leandro (STAFF)")
    .addStringOption(opt => opt.setName("valor").setDescription("Valor").setRequired(true)),

  new SlashCommandBuilder()
    .setName("entrevista")
    .setDescription("📌 Envia mensagem de aguarde entrevista"),

  new SlashCommandBuilder()
    .setName("aprovado")
    .setDescription("✅ Aprovar um usuário")
    .addUserOption(opt => opt.setName("usuario").setDescription("Usuário aprovado").setRequired(true))
    .addStringOption(opt => opt.setName("motivo").setDescription("Motivo").setRequired(true)),

  new SlashCommandBuilder()
    .setName("reprovado")
    .setDescription("❌ Reprovar um usuário")
    .addUserOption(opt => opt.setName("usuario").setDescription("Usuário reprovado").setRequired(true))
    .addStringOption(opt => opt.setName("motivo").setDescription("Motivo").setRequired(true)),
].map(cmd => cmd.toJSON());

// ---------------- REGISTRAR ----------------
client.once("ready", async () => {
  console.log(`🤖 Bot online como ${client.user.tag}`);
  const rest = new REST({ version: "10" }).setToken(TOKEN);

  try {
    for (const guildId of GUILD_IDS) {
      if (!guildId) continue;
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guildId), { body: commands });
    }
  } catch (err) {
    console.error("Erro ao registrar comandos:", err);
  }
});

// ---------------- INTERAÇÕES ----------------
client.on("interactionCreate", async interaction => {
  try {
    if (!interaction.isChatInputCommand() && !interaction.isButton()) return;

    if (interaction.isButton()) {
      if (interaction.customId === "pegar_streamer") {
        await interaction.member.roles.add(STREAMER_ROLE);
        return interaction.reply({ content: "🎥 Cargo Streamer adicionado!", flags: 64 });
      }
    }

    if (!interaction.isChatInputCommand()) return;

    const commandName = interaction.commandName;
    const temPermissao = STAFF_ROLES.some(r => interaction.member.roles.cache.has(r));

    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ flags: 64 });
    }

    if (!temPermissao && commandName !== "cargostreamer") {
      return interaction.editReply({ content: "❌ Você não tem permissão." });
    }

    // AVISO
    if (commandName === "aviso") {
      const embed = new EmbedBuilder()
        .setColor(COLOR_PADRAO)
        .setTitle(interaction.options.getString("titulo"))
        .setDescription(interaction.options.getString("descricao"));

      await interaction.channel.send({ embeds: [embed] });
      return interaction.editReply({ content: "📣 Aviso enviado!" });
    }

    // EVENTO
    if (commandName === "evento") {
      const embed = new EmbedBuilder()
        .setColor(COLOR_PADRAO)
        .setTitle(`📅 ${interaction.options.getString("titulo")}`)
        .setDescription(
          `📝 ${interaction.options.getString("descricao")}\n\n` +
          `📆 **Data:** ${interaction.options.getString("data")}\n` +
          `⏰ **Horário:** ${interaction.options.getString("horario")}\n` +
          `📍 **Local:** ${interaction.options.getString("local")}\n` +
          `${interaction.options.getString("premiacao") ? `🏆 **Premiação:** ${interaction.options.getString("premiacao")}\n` : ""}` +
          `${interaction.options.getString("observacao") ? `📌 **Obs:** ${interaction.options.getString("observacao")}` : ""}`
        );

      await interaction.channel.send({ embeds: [embed] });
      return interaction.editReply({ content: "📅 Evento criado!" });
    }

    // PIX GABRIEL
    if (commandName === "pix") {
      const valor = interaction.options.getString("valor");
      const produto = interaction.options.getString("produto");

      const embed = new EmbedBuilder()
        .setColor(COLOR_PADRAO)
        .setDescription(
          `<:pix:1353064565293842532> **PIX**  - condadodoacoes@gmail.com  - BANCO BRADESCO -  (Gabriel Fellipe de Souza)\n\n` +
          `<:seta:1346148222044995714> **Valor:** ${valor}                 **Produto:** ${produto}\n\n` +
          `**Enviar o comprovante após o pagamento.**`
        );

      await interaction.channel.send({ embeds: [embed] });
      return interaction.editReply({ content: "💰 Cobrança PIX enviada!" });
    }

    // PIX LEANDRO
    if (commandName === "pix2") {
      const valor = interaction.options.getString("valor");

      const embed = new EmbedBuilder()
        .setColor(COLOR_PADRAO)
        .setDescription(
          `<:Pix:1351222074097664111> **PIX** - leandro.hevieira@gmail.com\n\n` +
          `<:seta:1346148222044995714> **VALOR:** ${valor}\n\n` +
          `**Enviar o comprovantes após o pagamento.**`
        );

      await interaction.channel.send({ embeds: [embed] });
      return interaction.editReply({ content: "💰 Cobrança PIX enviada!" });
    }

    // ENTREVISTA
    if (commandName === "entrevista") {
      await interaction.channel.send({ content: "📌 Aguarde, você será chamado(a) para entrevista." });
      return interaction.editReply({ content: "Mensagem enviada!" });
    }

    // APROVADO
    if (commandName === "aprovado") {
      await interaction.channel.send({
        content: `✅ ${interaction.options.getUser("usuario")} foi aprovado(a).\nMotivo: ${interaction.options.getString("motivo")}`
      });
      return interaction.editReply({ content: "Aprovação enviada!" });
    }

    // REPROVADO
    if (commandName === "reprovado") {
      await interaction.channel.send({
        content: `❌ ${interaction.options.getUser("usuario")} foi reprovado(a).\nMotivo: ${interaction.options.getString("motivo")}`
      });
      return interaction.editReply({ content: "Reprovação enviada!" });
    }

  } catch (err) {
    console.error("Erro:", err);
  }
});

// ---------------- LOGIN ----------------
client.login(TOKEN);

// ---------------- WEB ----------------
const app = express();
app.get("/", (req, res) => res.send("Bot online!"));
app.listen(process.env.PORT || 3000);
