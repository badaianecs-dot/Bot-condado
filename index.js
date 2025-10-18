// ==================== CONFIGURAÇÃO DE VARIÁVEIS ====================
require("dotenv").config();

const { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  EmbedBuilder, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder, 
  SlashCommandBuilder, 
  REST, 
  Routes, 
  ButtonBuilder, 
  ButtonStyle 
} = require("discord.js");

const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("Bot rodando! ✅"));
app.listen(PORT, () => console.log(`🌐 Servidor web ativo na porta ${PORT}`));

// ==================== CONFIGURAÇÃO DO BOT ====================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers, // ESSENCIAL para interaction.member
  ],
  partials: [Partials.Channel],
});

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_IDS = [process.env.GUILD_ID1, process.env.GUILD_ID2];

// ==================== CARGOS ====================
const COLOR_PADRAO = "#f6b21b";
const STAFF_ROLES = [
  "1136127586737590412",
  "1181617285530660904",
  "1123014410496118784",
  "1197207305968701521",
  "1207449146919882782"
];
const STREAMER_ROLE = "1150955061606895737";
const CIDADAO_ROLE = "1136132647115030608";

// ==================== COMANDOS ====================
const commands = [
  new SlashCommandBuilder().setName("aviso").setDescription("📣 Enviar um aviso"),
  new SlashCommandBuilder()
    .setName("evento")
    .setDescription("📅 Criar um evento")
    .addStringOption(opt => opt.setName("titulo").setDescription("Título do evento").setRequired(true))
    .addStringOption(opt => opt.setName("descricao").setDescription("Descrição do evento").setRequired(true))
    .addStringOption(opt => opt.setName("data").setDescription("Data do evento").setRequired(true))
    .addStringOption(opt => opt.setName("horario").setDescription("Horário do evento").setRequired(true))
    .addStringOption(opt => opt.setName("local").setDescription("Local do evento").setRequired(true))
    .addStringOption(opt => opt.setName("premiacao").setDescription("Premiação (opcional)").setRequired(false))
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
].map(cmd => cmd.toJSON());

// ==================== REGISTRAR COMANDOS ====================
client.once("ready", async () => {
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

// ==================== INTERAÇÕES ====================
client.on("interactionCreate", async interaction => {
  try {
    // ---------- MODAL SUBMIT ----------
    if (interaction.isModalSubmit() && interaction.customId === "modalAviso") {
      // Garantir que temos o membro
      let member = interaction.member;
      if (!member) member = await interaction.guild.members.fetch(interaction.user.id);

      if (!STAFF_ROLES.some(r => member.roles.cache.has(r)))
        return interaction.reply({ content: "❌ Você não tem permissão.", ephemeral: true });

      const titulo = interaction.fields.getTextInputValue("tituloAviso");
      const descricao = interaction.fields.getTextInputValue("descricaoAviso").replace(/\\n/g, "\n");
      const imagem = interaction.fields.getTextInputValue("imagemAviso") || null;

      const embed = new EmbedBuilder()
        .setColor(COLOR_PADRAO)
        .setTitle(titulo)
        .setDescription(descricao)
        .setFooter({
          text: "Atenciosamente, Condado.",
          iconURL: "https://message.style/cdn/images/68f85b92c91261ecce65f4c8e2965bd56787314598cd6e5433919c5690491550.png",
        });

      if (imagem) embed.setImage(imagem);

      await interaction.channel.send({ content: `<@&${CIDADAO_ROLE}> @everyone`, embeds: [embed] });

      return interaction.reply({ content: "✅ Aviso enviado com sucesso!", ephemeral: true });
    }

    // ---------- CHAT COMMANDS ----------
    if (interaction.isChatInputCommand()) {
      const cmd = interaction.commandName;
      const member = interaction.member || await interaction.guild.members.fetch(interaction.user.id);
      if (!STAFF_ROLES.some(r => member.roles.cache.has(r)))
        return interaction.reply({ content: "❌ Você não tem permissão.", ephemeral: true });

      // ---------- /aviso ----------
      if (cmd === "aviso") {
        const modal = new ModalBuilder().setCustomId("modalAviso").setTitle("📣 Enviar Aviso");

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("tituloAviso")
              .setLabel("Título do aviso")
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("descricaoAviso")
              .setLabel("Descrição do aviso (use \\n para quebrar linha)")
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("imagemAviso")
              .setLabel("Link da imagem (opcional)")
              .setStyle(TextInputStyle.Short)
              .setRequired(false)
          )
        );

        return interaction.showModal(modal);
      }

      // ---------- /evento ----------
      if (cmd === "evento") {
        const titulo = interaction.options.getString("titulo");
        const descricao = interaction.options.getString("descricao");
        const data = interaction.options.getString("data");
        const horario = interaction.options.getString("horario");
        const local = interaction.options.getString("local");
        const premiacao = interaction.options.getString("premiacao");
        const observacao = interaction.options.getString("observacao");
        const imagem = interaction.options.getAttachment("imagem")?.url || null;

        let descEmbed = `${descricao}\n\n**Data:** ${data}\n**Horário:** ${horario}\n**Local:** ${local}`;
        if (premiacao) descEmbed += `\n**Premiação:** ${premiacao}`;
        if (observacao) descEmbed += `\n**Observação:** ${observacao}`;

        const embed = new EmbedBuilder().setColor(COLOR_PADRAO).setTitle(titulo).setDescription(descEmbed);
        if (imagem) embed.setImage(imagem);

        await interaction.channel.send({ embeds: [embed] });
        await interaction.channel.send({ content: `<@&${CIDADAO_ROLE}> @everyone` });

        return interaction.reply({ content: "✅ Evento enviado!", ephemeral: true });
      }

      // ---------- /cargostreamer ----------
      if (cmd === "cargostreamer") {
        const embed = new EmbedBuilder()
          .setColor(COLOR_PADRAO)
          .setTitle("Seja Streamer!")
          .setDescription(`Após uma semana, cumprindo os requisitos, você receberá os benefícios na cidade.\n\nReaja com <:Streamer:1353492062376558674> para receber o cargo Streamer!`);

        const mensagem = await interaction.channel.send({ embeds: [embed] });
        await mensagem.react("1353492062376558674");

        return interaction.reply({ content: "✅ Mensagem de cargo enviada!", ephemeral: true });
      }

      // ---------- /pix e /pix2 ----------
      if (cmd === "pix" || cmd === "pix2") {
        const valor = interaction.options.getString("valor");
        const item = cmd === "pix" ? interaction.options.getString("produto") : interaction.options.getString("servico");
        const desconto = interaction.options.getString("desconto");

        let descricao = `<:Pix:1351222074097664111> **PIX** - ${cmd === "pix" ? "condadodoacoes@gmail.com - BANCO BRADESCO (Gabriel Fellipe de Souza)" : "leandro.hevieira@gmail.com"}\n\n`;
        descricao += `<:seta:1346148222044995714> **VALOR:** ${valor}\u2003\u2003\u2003**${cmd === "pix" ? "Produto" : "Serviço"}:** ${item}\n\n`;
        descricao += "**Enviar o comprovante após o pagamento.**\n";
        if (desconto) descricao += `\n*Desconto aplicado: ${desconto}%*`;

        const embed = new EmbedBuilder().setColor("#00FF00").setDescription(descricao);
        await interaction.channel.send({ embeds: [embed] });

        return interaction.reply({ content: "✅ PIX enviado com sucesso!", ephemeral: true });
      }

      // ---------- /entrevista ----------
      if (cmd === "entrevista") {
        const embed = new EmbedBuilder()
          .setColor(COLOR_PADRAO)
          .setTitle("Olá, visitantes!")
          .setDescription("As entrevistas já estão disponíveis. Para participar, clique no botão abaixo e um membro da equipe irá atendê-lo em breve.\n\nDesejamos boa sorte!");

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel("Aguarde Entrevista")
            .setStyle(ButtonStyle.Link)
            .setURL("https://discord.com/channels/1120401688713502772/1179115356854439966")
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.channel.send({ content: `<@&1136131478888124526>` });

        return interaction.reply({ content: "✅ Mensagem de entrevista enviada com sucesso!", ephemeral: true });
      }
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

// ==================== REAÇÕES ====================
client.on("messageReactionAdd", async (reaction, user) => {
  try {
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();
    if (user.bot) return;

    if (reaction.emoji.id === "1353492062376558674") {
      const member = await reaction.message.guild.members.fetch(user.id);
      await member.roles.add(STREAMER_ROLE);
    }
  } catch (err) {
    console.error("Erro em messageReactionAdd:", err);
  }
});

// ==================== LOGIN ====================
client.login(TOKEN);
