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
const GUILD_ID = process.env.GUILD_ID;
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
    .addAttachmentOption(opt => opt.setName("imagem").setDescription("Imagem opcional").setRequired(false)),

  new SlashCommandBuilder()
    .setName("cargostreamer")
    .setDescription("Mensagem para pegar o cargo Streamer"),

  new SlashCommandBuilder()
    .setName("teste")
    .setDescription("Comando de teste"),
].map(cmd => cmd.toJSON());

// ---------------- REGISTRAR COMANDOS ----------------
client.once("ready", async () => {
  console.log(`🤖 Bot online como ${client.user.tag}`);
  const rest = new REST({ version: "10" }).setToken(TOKEN);

  try {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log("✅ Comandos registrados!");
  } catch (err) {
    console.error("❌ Erro ao registrar comandos:", err);
  }
});

// ---------------- INTERAÇÕES ----------------
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const temPermissao = STAFF_ROLES.some(r => interaction.member.roles.cache.has(r));

  try {
    await interaction.deferReply({ ephemeral: true });

    if (interaction.commandName === "teste") {
      return interaction.editReply({ content: "✅ Comando de teste funcionando!" });
    }

    if (interaction.commandName === "aviso") {
      const titulo = interaction.options.getString("titulo");
      const descricao = interaction.options.getString("descricao").replace(/\\n/g, "\n");
      const imagem = interaction.options.getAttachment("imagem")?.url || null;

      const embed = new EmbedBuilder().setColor(COLOR_PADRAO).setTitle(titulo).setDescription(descricao);
      if (imagem) embed.setImage(imagem);

      await interaction.channel.send({ embeds: [embed] });
      await interaction.channel.send({ content: `<@&${CIDADAO_ROLE}> @everyone` }); // menções abaixo do embed
      return interaction.editReply({ content: "✅ Aviso enviado!" });
    }

    if (interaction.commandName === "evento") {
      const titulo = interaction.options.getString("titulo");
      const descricao = interaction.options.getString("descricao");
      const data = interaction.options.getString("data");
      const horario = interaction.options.getString("horario");
      const local = interaction.options.getString("local");
      const premiacao = interaction.options.getString("premiacao");
      const observacao = interaction.options.getString("observacao");
      const imagem = interaction.options.getAttachment("imagem")?.url || null;

      let descEmbed = `**Descrição:** ${descricao}\n\n**Data:** ${data}\n**Horário:** ${horario}\n**Local:** ${local}`;
      if (premiacao) descEmbed += `\n**Premiação:** ${premiacao}`;
      if (observacao) descEmbed += `\n**Observação:** ${observacao}`;

      const embed = new EmbedBuilder().setColor(COLOR_PADRAO).setTitle(titulo).setDescription(descEmbed);
      if (imagem) embed.setImage(imagem);

      await interaction.channel.send({ embeds: [embed] });
      await interaction.channel.send({ content: `<@&${CIDADAO_ROLE}> @everyone` });
      return interaction.editReply({ content: "✅ Evento enviado!" });
    }

    if (interaction.commandName === "atualizacoes") {
      const textos = [];
      for (let i = 1; i <= 10; i++) {
        const txt = interaction.options.getString(`texto${i}`);
        if (txt) textos.push(txt);
      }
      const imagem = interaction.options.getAttachment("imagem")?.url || null;
      if (textos.length === 0) return interaction.editReply({ content: "❌ Informe pelo menos uma atualização." });

      const embed = new EmbedBuilder().setColor(COLOR_PADRAO).setTitle("ATUALIZAÇÕES").setDescription(textos.join("\n\n"));
      if (imagem) embed.setImage(imagem);

      await interaction.channel.send({ embeds: [embed] });
      await interaction.channel.send({ content: `<@&${CIDADAO_ROLE}> @everyone` });
      return interaction.editReply({ content: "✅ Atualizações enviadas!" });
    }

    if (interaction.commandName === "cargostreamer") {
      const embed = new EmbedBuilder()
        .setColor(COLOR_PADRAO)
        .setTitle("Seja Streamer!")
        .setDescription(`Após uma semana, cumprindo os requisitos, você receberá os benefícios na cidade.\n\nReaja com <:Streamer:1353492062376558674> para receber o cargo Streamer!`);

      const mensagem = await interaction.channel.send({ embeds: [embed] });
      await mensagem.react("1353492062376558674");
      return interaction.editReply({ content: "✅ Mensagem de cargo enviada!" });
    }

  } catch (err) {
    console.error("Erro em interactionCreate:", err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: "❌ Ocorreu um erro.", ephemeral: true });
    } else {
      await interaction.followUp({ content: "❌ Ocorreu um erro.", ephemeral: true });
    }
  }
});

// ---------------- EXPRESS ----------------
const app = express();
app.get("/", (req, res) => res.send("Bot está rodando e acordado! ✅"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🌐 Servidor web ativo!"));

// ---------------- LOGIN ----------------
client.login(TOKEN);
