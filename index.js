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
  InteractionResponseFlags
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
const GUILD_IDS = process.env.GUILD_IDS.split(","); // suporte múltiplas guilds
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
    .setName("aviso")
    .setDescription("📣 Enviar um aviso")
    .addStringOption(opt => opt.setName("titulo").setDescription("Título do aviso").setRequired(true))
    .addStringOption(opt => opt.setName("descricao").setDescription("Descrição do aviso (use \\n para quebrar linha)").setRequired(true))
    .addAttachmentOption(opt => opt.setName("imagem").setDescription("Imagem opcional").setRequired(false))
    .setDefaultMemberPermissions(0), // só STAFF
  new SlashCommandBuilder()
    .setName("evento")
    .setDescription("📅 Criar um evento")
    .addStringOption(opt => opt.setName("titulo").setDescription("Título do evento").setRequired(true))
    .addStringOption(opt => opt.setName("descricao").setDescription("Descrição do evento").setRequired(true))
    .addStringOption(opt => opt.setName("data").setDescription("Data do evento").setRequired(true))
    .addStringOption(opt => opt.setName("horario").setDescription("Horário do evento").setRequired(true))
    .addStringOption(opt => opt.setName("local").setDescription("Local do evento").setRequired(true))
    .addStringOption(opt => opt.setName("premiacao").setDescription("Premiação do evento (opcional)").setRequired(false))
    .addStringOption(opt => opt.setName("observacao").setDescription("Observação (opcional)").setRequired(false))
    .addAttachmentOption(opt => opt.setName("imagem").setDescription("Imagem opcional").setRequired(false))
    .setDefaultMemberPermissions(0),
  new SlashCommandBuilder()
    .setName("atualizacoes")
    .setDescription("📰 Enviar atualizações")
    .addStringOption(opt => opt.setName("texto1").setDescription("Atualização 1").setRequired(true))
    .addStringOption(opt => opt.setName("texto2").setDescription("Atualização 2").setRequired(false))
    .addStringOption(opt => opt.setName("texto3").setDescription("Atualização 3").setRequired(false))
    .addStringOption(opt => opt.setName("texto4").setDescription("Atualização 4").setRequired(false))
    .addStringOption(opt => opt.setName("texto5").setDescription("Atualização 5").setRequired(false))
    .addStringOption(opt => opt.setName("texto6").setDescription("Atualização 6").setRequired(false))
    .addStringOption(opt => opt.setName("texto7").setDescription("Atualização 7").setRequired(false))
    .addStringOption(opt => opt.setName("texto8").setDescription("Atualização 8").setRequired(false))
    .addStringOption(opt => opt.setName("texto9").setDescription("Atualização 9").setRequired(false))
    .addStringOption(opt => opt.setName("texto10").setDescription("Atualização 10").setRequired(false))
    .addAttachmentOption(opt => opt.setName("imagem").setDescription("Imagem opcional").setRequired(false))
    .setDefaultMemberPermissions(0),
  new SlashCommandBuilder()
    .setName("cargostreamer")
    .setDescription("Mensagem para pegar o cargo Streamer")
    .setDefaultMemberPermissions(0),
  new SlashCommandBuilder()
    .setName("pix")
    .setDescription("💰 PIX Gabriel (STAFF)")
    .addStringOption(opt => opt.setName("valor").setDescription("Valor").setRequired(true))
    .addStringOption(opt => opt.setName("produto").setDescription("Produto").setRequired(true))
    .addStringOption(opt => opt.setName("desconto").setDescription("Desconto (%) opcional").setRequired(false))
    .setDefaultMemberPermissions(0),
  new SlashCommandBuilder()
    .setName("pix2")
    .setDescription("💰 PIX Leandro (STAFF)")
    .addStringOption(opt => opt.setName("valor").setDescription("Valor").setRequired(true))
    .addStringOption(opt => opt.setName("servico").setDescription("Serviço").setRequired(true))
    .addStringOption(opt => opt.setName("desconto").setDescription("Desconto (%) opcional").setRequired(false))
    .setDefaultMemberPermissions(0),
  new SlashCommandBuilder()
    .setName("entrevista")
    .setDescription("📌 Envia mensagem de aguarde entrevista")
    .setDefaultMemberPermissions(0),
].map(cmd => cmd.toJSON());

// ---------------- REGISTRAR COMANDOS ----------------
client.once("ready", async () => {
  console.log(`🤖 Bot online como ${client.user.tag}`);
  const rest = new REST({ version: "10" }).setToken(TOKEN);

  try {
    // Registrar comandos em todas as guilds
    for (const guildId of GUILD_IDS) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guildId), { body: commands });
      console.log(`✅ Comandos registrados na guild ${guildId}`);
    }
  } catch (err) {
    console.error("❌ Erro ao registrar comandos:", err);
  }
});

// ---------------- INTERAÇÕES ----------------
client.on("interactionCreate", async (interaction) => {
  try {
    if (!interaction.isChatInputCommand()) return;

    const commandName = interaction.commandName;
    const temPermissao = STAFF_ROLES.some(r => interaction.member.roles.cache.has(r));

    if (!temPermissao) {
      return interaction.reply({
        content: "❌ Você não tem permissão para usar este comando.",
        flags: InteractionResponseFlags.Ephemeral
      });
    }

    // Defer seguro
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ flags: InteractionResponseFlags.Ephemeral }).catch(() => {});
    }

    // ---------------- COMANDOS ----------------
    if (commandName === "aviso") {
      const titulo = interaction.options.getString("titulo");
      const descricao = interaction.options.getString("descricao").replace(/\\n/g, "\n");
      const imagem = interaction.options.getAttachment("imagem")?.url || null;

      const embed = new EmbedBuilder().setColor(COLOR_PADRAO).setTitle(titulo).setDescription(descricao);
      if (imagem) embed.setImage(imagem);

      await interaction.channel.send({ embeds: [embed] });
      await interaction.channel.send({ content: `<@&${CIDADAO_ROLE}> @everyone` });
      return interaction.editReply({ content: "✅ Aviso enviado!" });
    }

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

    // ...adicione os outros comandos seguindo o mesmo padrão
  } catch (err) {
    console.error("Erro em interactionCreate:", err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: "❌ Ocorreu um erro.", flags: InteractionResponseFlags.Ephemeral });
    } else {
      await interaction.followUp({ content: "❌ Ocorreu um erro.", flags: InteractionResponseFlags.Ephemeral });
    }
  }
});

// ---------------- EXPRESS ----------------
const app = express();
app.get("/", (req, res) => res.send("Bot ativo!"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🌐 Servidor web ativo!"));

// ---------------- LOGIN ----------------
client.login(TOKEN);
