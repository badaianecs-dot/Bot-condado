const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

require("dotenv").config();
const express = require("express");

// ---------------- CLIENTE ----------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ---------------- CONFIGURAÇÕES ----------------
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_IDS = [process.env.GUILD_ID1, process.env.GUILD_ID2];

const COLOR_PADRAO = "#f6b21b";

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
    .addStringOption(o => o.setName("titulo").setDescription("Título").setRequired(true))
    .addStringOption(o => o.setName("descricao").setDescription("Descrição").setRequired(true))
    .addAttachmentOption(o => o.setName("imagem").setDescription("Imagem opcional")),

  new SlashCommandBuilder()
    .setName("evento")
    .setDescription("📅 Criar um evento")
    .addStringOption(o => o.setName("titulo").setDescription("Título").setRequired(true))
    .addStringOption(o => o.setName("descricao").setDescription("Descrição").setRequired(true))
    .addStringOption(o => o.setName("data").setDescription("Data").setRequired(true))
    .addStringOption(o => o.setName("horario").setDescription("Horário").setRequired(true))
    .addStringOption(o => o.setName("local").setDescription("Local").setRequired(true))
    .addStringOption(o => o.setName("premiacao").setDescription("Premiação"))
    .addStringOption(o => o.setName("observacao").setDescription("Observação"))
    .addAttachmentOption(o => o.setName("imagem").setDescription("Imagem opcional")),

  new SlashCommandBuilder()
    .setName("pix")
    .setDescription("💰 PIX Gabriel (STAFF)")
    .addStringOption(o => o.setName("valor").setDescription("Valor").setRequired(true))
    .addStringOption(o => o.setName("produto").setDescription("Produto").setRequired(true))
    .addStringOption(o => o.setName("desconto").setDescription("Desconto (%) opcional")),

  new SlashCommandBuilder()
    .setName("pix2")
    .setDescription("💰 PIX Leandro (STAFF)")
    .addStringOption(o => o.setName("valor").setDescription("Valor").setRequired(true))
    .addStringOption(o => o.setName("servico").setDescription("Serviço").setRequired(true))
    .addStringOption(o => o.setName("desconto").setDescription("Desconto (%) opcional")),

  new SlashCommandBuilder()
    .setName("entrevista")
    .setDescription("📌 Envia mensagem de aguarde entrevista"),

  new SlashCommandBuilder()
    .setName("aprovado")
    .setDescription("✅ Aprovar um usuário")
    .addUserOption(o => o.setName("usuario").setDescription("Usuário aprovado").setRequired(true))
    .addStringOption(o => o.setName("motivo").setDescription("Motivo").setRequired(true)),

  new SlashCommandBuilder()
    .setName("reprovado")
    .setDescription("❌ Reprovar um usuário")
    .addUserOption(o => o.setName("usuario").setDescription("Usuário reprovado").setRequired(true))
    .addStringOption(o => o.setName("motivo").setDescription("Motivo").setRequired(true)),
].map(cmd => cmd.toJSON());

// ---------------- REGISTRAR COMANDOS ----------------
client.once("clientReady", async () => {
  console.log(`🤖 Bot online como ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  for (const guildId of GUILD_IDS) {
    if (!guildId) continue;
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, guildId),
      { body: commands }
    );
    console.log(`✅ Comandos registrados na guild ${guildId}`);
  }
});

// ---------------- INTERAÇÕES ----------------
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const commandName = interaction.commandName;

  const temPermissao = STAFF_ROLES.some(r =>
    interaction.member.roles.cache.has(r)
  );

  if (!temPermissao) {
    return interaction.reply({
      content: "❌ Você não tem permissão.",
      ephemeral: true
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

    await interaction.reply({ embeds: [embed] });
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

    embed.setTitle(`📅 ${titulo}`)
      .setDescription(`${descricao}\n\n📆 ${data}\n⏰ ${horario}\n📍 ${local}`);

    if (premiacao) embed.addFields({ name: "🏆 Premiação", value: premiacao });
    if (observacao) embed.addFields({ name: "📌 Observação", value: observacao });
    if (imagem) embed.setImage(imagem.url);

    await interaction.reply({ embeds: [embed] });
  }

  // ================= PIX =================
  if (commandName === "pix") {
    const valor = parseFloat(interaction.options.getString("valor").replace(",", "."));
    const produto = interaction.options.getString("produto");
    const desconto = interaction.options.getString("desconto");

    let valorFinal = valor;

    if (desconto) {
      const descontoNum = parseFloat(desconto);
      valorFinal = valor - (valor * descontoNum / 100);
    }

    embed
      .setTitle("💰 Pagamento via PIX - Gabriel")
      .setDescription(
        `🛒 Produto: ${produto}\n💵 Valor: R$ ${valorFinal.toFixed(2)}`
      );

    await interaction.reply({ embeds: [embed] });
  }

  // ================= PIX2 =================
  if (commandName === "pix2") {
    const valor = parseFloat(interaction.options.getString("valor").replace(",", "."));
    const servico = interaction.options.getString("servico");
    const desconto = interaction.options.getString("desconto");

    let valorFinal = valor;

    if (desconto) {
      const descontoNum = parseFloat(desconto);
      valorFinal = valor - (valor * descontoNum / 100);
    }

    embed
      .setTitle("💰 Pagamento via PIX - Leandro")
      .setDescription(
        `🛠️ Serviço: ${servico}\n💵 Valor: R$ ${valorFinal.toFixed(2)}`
      );

    await interaction.reply({ embeds: [embed] });
  }

  // ================= ENTREVISTA =================
  if (commandName === "entrevista") {
    embed
      .setTitle("📌 Aguarde sua entrevista")
      .setDescription("A staff irá chamar você em breve.");

    await interaction.reply({ embeds: [embed] });
  }

  // ================= APROVADO =================
  if (commandName === "aprovado") {
    const usuario = interaction.options.getUser("usuario");
    const motivo = interaction.options.getString("motivo");

    embed
      .setColor("#00FF00")
      .setTitle("✅ Passaporte aprovado!")
      .setDescription(`👤 ${usuario}\n📝 Motivo: ${motivo}`);

    await interaction.reply({ embeds: [embed] });
  }

  // ================= REPROVADO =================
  if (commandName === "reprovado") {
    const usuario = interaction.options.getUser("usuario");
    const motivo = interaction.options.getString("motivo");

    embed
      .setColor("#FF0000")
      .setTitle("❌ Passaporte reprovado!")
      .setDescription(`👤 ${usuario}\n📝 Motivo: ${motivo}`);

    await interaction.reply({ embeds: [embed] });
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
  console.log(`🌐 Servidor rodando na porta ${PORT}`);
});
