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
const CIDADAO_ROLE = "1136132647115030608";

// ---------------- COMANDOS ----------------
const commands = [
  new SlashCommandBuilder()
    .setName("aviso")
    .setDescription("📣 Enviar um aviso")
    .addStringOption(opt => opt.setName("titulo").setDescription("Título do aviso").setRequired(true))
    .addStringOption(opt => opt.setName("descricao").setDescription("Descrição do aviso (use \\n para quebrar linha)").setRequired(true))
    .addAttachmentOption(opt => opt.setName("imagem").setDescription("Imagem opcional").setRequired(false)),

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
    .addAttachmentOption(opt => opt.setName("imagem").setDescription("Imagem opcional").setRequired(false)),

  new SlashCommandBuilder().setName("cargostreamer").setDescription("Mensagem para pegar o cargo Streamer"),

  new SlashCommandBuilder()
    .setName("pix")
    .setDescription("💰 PIX Gabriel (STAFF)")
    .addStringOption(opt => opt.setName("valor").setDescription("Valor").setRequired(true))
    .addStringOption(opt => opt.setName("produto").setDescription("Produto").setRequired(true))
    .addStringOption(opt => opt.setName("desconto").setDescription("Desconto (%) opcional").setRequired(false)),

  new SlashCommandBuilder()
    .setName("pix2")
    .setDescription("💰 PIX Leandro (STAFF)")
    .addStringOption(opt => opt.setName("valor").setDescription("Valor").setRequired(true))
    .addStringOption(opt => opt.setName("servico").setDescription("Serviço").setRequired(true))
    .addStringOption(opt => opt.setName("desconto").setDescription("Desconto (%) opcional").setRequired(false)),

  new SlashCommandBuilder().setName("entrevista").setDescription("📌 Envia mensagem de aguarde entrevista"),

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
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guildId), { body: commands });
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
    const temPermissao = STAFF_ROLES.some(r => interaction.member.roles.cache.has(r));
    const comandosSemDefer = ["pix", "pix2"];

    if (!interaction.deferred && !interaction.replied && !comandosSemDefer.includes(commandName)) {
      await interaction.deferReply({ flags: 64 });
    }

    if (!temPermissao) {
      if (interaction.deferred || interaction.replied) {
        return interaction.editReply({ content: "❌ Você não tem permissão para usar este comando." });
      } else {
        return interaction.reply({ content: "❌ Você não tem permissão para usar este comando.", flags: 64 });
      }
    }

    // /aprovado
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
          text: "Atenciosamente, Condado.",
          iconURL: "https://message.style/cdn/images/68f85b92c91261ecce65f4c8e2965bd56787314598cd6e5433919c5690491550.png"
        });

      await interaction.channel.send({ embeds: [embed] });
      return interaction.editReply({ content: "✅ Aprovação enviada!" });
    }

    // /reprovado
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
          text: "Atenciosamente, Condado.",
          iconURL: "https://message.style/cdn/images/68f85b92c91261ecce65f4c8e2965bd56787314598cd6e5433919c5690491550.png"
        });

      await interaction.channel.send({ embeds: [embed] });
      return interaction.editReply({ content: "❌ Reprovação enviada!" });
    }

  } catch (err) {
    console.error("Erro em interactionCreate:", err);
  }
});

// ---------------- LOGIN ----------------
if (!TOKEN) {
  console.error("❌ TOKEN não encontrado nas variáveis de ambiente!");
  process.exit(1);
}

client.login(TOKEN).catch(err => {
  console.error("❌ Erro ao logar no Discord:", err);
});

// ---------------- SERVIDOR EXPRESS (RENDER) ----------------
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Bot Condado está online!");
});

app.listen(PORT, () => {
  console.log(`🌐 Servidor web rodando na porta ${PORT}`);
});
