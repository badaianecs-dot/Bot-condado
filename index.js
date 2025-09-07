require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  SlashCommandBuilder,
  REST,
  Routes,
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
const GUILD_IDS = process.env.GUILD_IDS.split(","); // IDs separados por vírgula
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
    .addStringOption((opt) =>
      opt.setName("titulo").setDescription("Título do aviso").setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("descricao")
        .setDescription("Descrição do aviso (use \\n para quebrar linha)")
        .setRequired(true)
    )
    .addAttachmentOption((opt) =>
      opt.setName("imagem").setDescription("Imagem opcional").setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName("evento")
    .setDescription("📅 Criar um evento")
    .addStringOption((opt) => opt.setName("titulo").setDescription("Título do evento").setRequired(true))
    .addStringOption((opt) => opt.setName("descricao").setDescription("Descrição do evento").setRequired(true))
    .addStringOption((opt) => opt.setName("data").setDescription("Data do evento").setRequired(true))
    .addStringOption((opt) => opt.setName("horario").setDescription("Horário do evento").setRequired(true))
    .addStringOption((opt) => opt.setName("local").setDescription("Local do evento").setRequired(true))
    .addStringOption((opt) => opt.setName("premiacao").setDescription("Premiação do evento (opcional)").setRequired(false))
    .addStringOption((opt) => opt.setName("observacao").setDescription("Observação (opcional)").setRequired(false))
    .addAttachmentOption((opt) => opt.setName("imagem").setDescription("Imagem opcional").setRequired(false)),
  new SlashCommandBuilder()
    .setName("atualizacoes")
    .setDescription("📰 Enviar atualizações")
    .addStringOption((opt) => opt.setName("texto1").setDescription("Atualização 1").setRequired(true))
    .addStringOption((opt) => opt.setName("texto2").setDescription("Atualização 2").setRequired(false))
    .addStringOption((opt) => opt.setName("texto3").setDescription("Atualização 3").setRequired(false))
    .addStringOption((opt) => opt.setName("texto4").setDescription("Atualização 4").setRequired(false))
    .addStringOption((opt) => opt.setName("texto5").setDescription("Atualização 5").setRequired(false))
    .addStringOption((opt) => opt.setName("texto6").setDescription("Atualização 6").setRequired(false))
    .addStringOption((opt) => opt.setName("texto7").setDescription("Atualização 7").setRequired(false))
    .addStringOption((opt) => opt.setName("texto8").setDescription("Atualização 8").setRequired(false))
    .addStringOption((opt) => opt.setName("texto9").setDescription("Atualização 9").setRequired(false))
    .addStringOption((opt) => opt.setName("texto10").setDescription("Atualização 10").setRequired(false))
    .addAttachmentOption((opt) => opt.setName("imagem").setDescription("Imagem opcional").setRequired(false)),
  new SlashCommandBuilder().setName("cargostreamer").setDescription("Mensagem para pegar o cargo Streamer"),
  new SlashCommandBuilder()
    .setName("pix")
    .setDescription("💰 PIX Gabriel (STAFF)")
    .addStringOption((opt) => opt.setName("valor").setDescription("Valor").setRequired(true))
    .addStringOption((opt) => opt.setName("produto").setDescription("Produto").setRequired(true))
    .addStringOption((opt) => opt.setName("desconto").setDescription("Desconto (%) opcional").setRequired(false)),
  new SlashCommandBuilder()
    .setName("pix2")
    .setDescription("💰 PIX Leandro (STAFF)")
    .addStringOption((opt) => opt.setName("valor").setDescription("Valor").setRequired(true))
    .addStringOption((opt) => opt.setName("servico").setDescription("Serviço").setRequired(true))
    .addStringOption((opt) => opt.setName("desconto").setDescription("Desconto (%) opcional").setRequired(false)),
  new SlashCommandBuilder()
    .setName("entrevista")
    .setDescription("📌 Envia mensagem de aguarde entrevista"),
].map((c) => c.toJSON());

// ---------------- REGISTRAR COMANDOS ----------------
client.once("ready", async () => {
  console.log(`🤖 Bot online como ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  try {
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
    const temPermissao = STAFF_ROLES.some((r) => interaction.member.roles.cache.has(r));

    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ ephemeral: true });
    }

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

    if (commandName === "evento") {
      const titulo = interaction.options.getString("titulo");
      const descricao = interaction.options.getString("descricao");
      const data = interaction.options.getString("data");
      const horario = interaction.options.getString("horario");
      const local = interaction.options.getString("local");
      const premiacao = interaction.options.getString("premiacao");
      const observacao = interaction.options.getString("observacao");
      const imagem = interaction.options.getAttachment("imagem")?.url || null;

      let descEmbed = `**Descrição:** ${descricao}\n\n**Data:** ${data}\n\n**Horário:** ${horario}\n\n**Local:** ${local}`;
      if (premiacao) descEmbed += `\n\n**Premiação:** ${premiacao}`;
      if (observacao) descEmbed += `\n\n**Observação:** ${observacao}`;

      const embed = new EmbedBuilder().setColor(COLOR_PADRAO).setTitle(titulo).setDescription(descEmbed);
      if (imagem) embed.setImage(imagem);

      await interaction.channel.send({ embeds: [embed] });
      await interaction.channel.send({ content: `<@&${CIDADAO_ROLE}> @everyone` });
      return interaction.editReply({ content: "✅ Evento enviado!" });
    }

    if (commandName === "atualizacoes") {
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

    if (commandName === "cargostreamer") {
      await interaction.member.roles.add(STREAMER_ROLE);
      return interaction.editReply({ content: "✅ Cargo Streamer adicionado!" });
    }

    if (commandName === "pix" || commandName === "pix2") {
      if (!temPermissao) return interaction.editReply({ content: "❌ Você não tem permissão." });

      const valor = interaction.options.getString("valor");
      const produto = interaction.options.getString("produto") || interaction.options.getString("servico");
      const desconto = interaction.options.getString("desconto") || null;

      let msg = `💰 **PIX**\nProduto/Serviço: ${produto}\nValor: ${valor}`;
      if (desconto) msg += `\nDesconto: ${desconto}%`;

      await interaction.channel.send(msg);
      return interaction.editReply({ content: "✅ PIX enviado!" });
    }

    if (commandName === "entrevista") {
      await interaction.channel.send("📌 Aguarde, sua entrevista será iniciada em breve!");
      return interaction.editReply({ content: "✅ Mensagem de entrevista enviada!" });
    }
  } catch (err) {
    console.error("Erro em interactionCreate:", err);
    if (interaction.deferred || interaction.replied) {
      interaction.editReply({ content: "❌ Ocorreu um erro." }).catch(() => {});
    } else {
      interaction.reply({ content: "❌ Ocorreu um erro.", ephemeral: true }).catch(() => {});
    }
  }
});

// ---------------- UPTIME ----------------
const app = express();
app.get("/", (req, res) => res.send("Bot ativo!"));
app.listen(3000, () => console.log("🌐 Servidor web ativo para manter o bot acordado!"));

// ---------------- LOGIN ----------------
client.login(TOKEN);
