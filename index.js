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
    .setName("aviso")
    .setDescription("📣 Enviar um aviso")
    .addStringOption(opt => opt.setName("titulo").setDescription("Título do aviso").setRequired(true))
    .addStringOption(opt => opt.setName("descricao").setDescription("Descrição (use \\n para quebrar linha)").setRequired(true))
    .addAttachmentOption(opt => opt.setName("imagem").setDescription("Imagem opcional")),

  new SlashCommandBuilder()
    .setName("evento")
    .setDescription("📅 Criar um evento")
    .addStringOption(opt => opt.setName("titulo").setDescription("Título").setRequired(true))
    .addStringOption(opt => opt.setName("descricao").setDescription("Descrição").setRequired(true))
    .addStringOption(opt => opt.setName("data").setDescription("Data").setRequired(true))
    .addStringOption(opt => opt.setName("horario").setDescription("Horário").setRequired(true))
    .addStringOption(opt => opt.setName("local").setDescription("Local").setRequired(true))
    .addStringOption(opt => opt.setName("premiacao").setDescription("Premiação"))
    .addStringOption(opt => opt.setName("observacao").setDescription("Observação"))
    .addAttachmentOption(opt => opt.setName("imagem").setDescription("Imagem opcional")),

  new SlashCommandBuilder()
    .setName("cargostreamer")
    .setDescription("Mensagem para pegar o cargo Streamer"),

  new SlashCommandBuilder()
    .setName("pix")
    .setDescription("💰 PIX Gabriel (STAFF)")
    .addStringOption(opt => opt.setName("valor").setDescription("Valor").setRequired(true))
    .addStringOption(opt => opt.setName("produto").setDescription("Produto").setRequired(true))
    .addStringOption(opt => opt.setName("desconto").setDescription("Desconto (%) opcional")),

  new SlashCommandBuilder()
    .setName("pix2")
    .setDescription("💰 PIX Leandro (STAFF)")
    .addStringOption(opt => opt.setName("valor").setDescription("Valor").setRequired(true))
    .addStringOption(opt => opt.setName("servico").setDescription("Serviço").setRequired(true))
    .addStringOption(opt => opt.setName("desconto").setDescription("Desconto (%) opcional")),

  new SlashCommandBuilder()
    .setName("entrevista")
    .setDescription("📌 Envia mensagem de aguarde entrevista"),

  new SlashCommandBuilder()
    .setName("aprovado")
    .setDescription("✅ Aprovar um usuário")
    .addUserOption(opt => opt.setName("usuario").setDescription("Usuário aprovado").setRequired(true))
    .addStringOption(opt => opt.setName("motivo").setDescription("Motivo da aprovação").setRequired(true)),

  new SlashCommandBuilder()
    .setName("reprovado")
    .setDescription("❌ Reprovar um usuário")
    .addUserOption(opt => opt.setName("usuario").setDescription("Usuário reprovado").setRequired(true))
    .addStringOption(opt => opt.setName("motivo").setDescription("Motivo da reprovação").setRequired(true)),
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
    console.error("Erro ao registrar comandos:", err);
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

    const embed = new EmbedBuilder().setColor(COLOR_PADRAO);

    // ================= AVISO =================
    if (commandName === "aviso") {
      const titulo = interaction.options.getString("titulo");
      const descricao = interaction.options.getString("descricao").replace(/\\n/g, "\n");
      const imagem = interaction.options.getAttachment("imagem");

      embed.setTitle(titulo).setDescription(descricao);
      if (imagem) embed.setImage(imagem.url);

      await interaction.channel.send({ embeds: [embed] });
      return interaction.editReply({ content: "📣 Aviso enviado!" });
    }

    // ================= EVENTO =================
    if (commandName === "evento") {
      const titulo = interaction.options.getString("titulo");
      const descricao = interaction.options.getString("descricao");
      const data = interaction.options.getString("data");
      const horario = interaction.options.getString("horario");
      const local = interaction.options.getString("local");
      const premiacao = interaction.options.getString("premiacao");
      const observacao = interaction.options.getString("observacao");
      const imagem = interaction.options.getAttachment("imagem");

      embed
        .setTitle(`📅 ${titulo}`)
        .setDescription(
          `${descricao}\n\n📆 **Data:** ${data}\n⏰ **Horário:** ${horario}\n📍 **Local:** ${local}`
        );

      if (premiacao) embed.addFields({ name: "🏆 Premiação", value: premiacao });
      if (observacao) embed.addFields({ name: "📌 Observação", value: observacao });
      if (imagem) embed.setImage(imagem.url);

      await interaction.channel.send({ embeds: [embed] });
      return interaction.editReply({ content: "📅 Evento criado!" });
    }

    // ================= ENTREVISTA =================
    if (commandName === "entrevista") {
      embed
        .setTitle("📌 Aguarde sua entrevista")
        .setDescription("Em breve um membro da staff irá chamar você.");

      await interaction.channel.send({ embeds: [embed] });
      return interaction.editReply({ content: "Mensagem enviada!" });
    }

    // ================= APROVADO =================
    if (commandName === "aprovado") {
      const usuario = interaction.options.getUser("usuario");
      const motivo = interaction.options.getString("motivo");

      embed
        .setColor("#00FF00")
        .setTitle("✅ Passaporte aprovado!")
        .setDescription(`👤 ${usuario}\n📝 **Motivo:** ${motivo}`);

      await interaction.channel.send({ embeds: [embed] });
      return interaction.editReply({ content: "Aprovação enviada!" });
    }

    // ================= REPROVADO =================
    if (commandName === "reprovado") {
      const usuario = interaction.options.getUser("usuario");
      const motivo = interaction.options.getString("motivo");

      embed
        .setColor("#FF0000")
        .setTitle("❌ Passaporte reprovado!")
        .setDescription(`👤 ${usuario}\n📝 **Motivo:** ${motivo}`);

      await interaction.channel.send({ embeds: [embed] });
      return interaction.editReply({ content: "Reprovação enviada!" });
    }

  } catch (err) {
    console.error("Erro em interactionCreate:", err);
  }
});

// ---------------- LOGIN ----------------
client.login(TOKEN);

// ---------------- SERVIDOR WEB (RENDER) ----------------
const app = express();

app.get("/", (req, res) => {
  res.send("Bot Condado está online!");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🌐 Servidor web rodando na porta ${PORT}`);
});
