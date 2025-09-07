require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  REST,
  Routes,
  InteractionResponseFlags,
  Events,
} = require("discord.js");

const COLOR_PADRAO = "#00FFFF"; // cor padrão dos embeds
const CLIENT_ID = process.env.CLIENT_ID;
const TOKEN = process.env.TOKEN;
const GUILDS = process.env.GUILDS?.split(",") || []; // separar múltiplas guilds por vírgula
const STAFF_ROLES = process.env.STAFF_ROLES?.split(",") || [];
const CIDADAO_ROLE = process.env.CIDADAO_ROLE;

// Inicializando client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel],
});

client.once(Events.ClientReady, () => {
  console.log(`🤖 Bot online como ${client.user.tag}`);
});

// Registro de comandos
const commands = [
  // /aviso
  {
    name: "aviso",
    description: "Envia um aviso para a cidade",
    options: [
      { name: "titulo", type: 3, description: "Título do aviso", required: true },
      { name: "descricao", type: 3, description: "Descrição do aviso", required: true },
      { name: "imagem", type: 11, description: "Imagem do embed", required: false },
    ],
  },
  // /evento
  {
    name: "evento",
    description: "Cria um evento",
    options: [
      { name: "titulo", type: 3, description: "Título do evento", required: true },
      { name: "descricao", type: 3, description: "Descrição do evento", required: true },
      { name: "data", type: 3, description: "Data do evento", required: true },
      { name: "horario", type: 3, description: "Horário do evento", required: true },
      { name: "local", type: 3, description: "Local do evento", required: true },
      { name: "premiacao", type: 3, description: "Premiação", required: false },
      { name: "observacao", type: 3, description: "Observações", required: false },
      { name: "imagem", type: 11, description: "Imagem do embed", required: false },
    ],
  },
  // /atualizacoes
  {
    name: "atualizacoes",
    description: "Envia atualizações",
    options: Array.from({ length: 10 }, (_, i) => ({
      name: `texto${i + 1}`,
      type: 3,
      description: `Atualização ${i + 1}`,
      required: false,
    })).concat([
      { name: "imagem", type: 11, description: "Imagem do embed", required: false },
    ]),
  },
  // /pix
  {
    name: "pix",
    description: "Envia informações de pagamento PIX",
    options: [
      { name: "valor", type: 3, description: "Valor do PIX", required: true },
      { name: "produto", type: 3, description: "Produto", required: true },
      { name: "desconto", type: 3, description: "Desconto (%)", required: false },
    ],
  },
  // /pix2
  {
    name: "pix2",
    description: "Envia informações de pagamento PIX (serviço)",
    options: [
      { name: "valor", type: 3, description: "Valor do PIX", required: true },
      { name: "servico", type: 3, description: "Serviço", required: true },
      { name: "desconto", type: 3, description: "Desconto (%)", required: false },
    ],
  },
  // /cargostreamer
  { name: "cargostreamer", description: "Mensagem de cargo streamer" },
  // /entrevista
  { name: "entrevista", description: "Mensagem de entrevista" },
];

// Registrar comandos nas guilds permitidas
const rest = new REST({ version: "10" }).setToken(TOKEN);
(async () => {
  try {
    for (const guild of GUILDS) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guild), { body: commands });
    }
    console.log("✅ Comandos registrados apenas nas guilds permitidas!");
  } catch (err) {
    console.error("❌ Erro ao registrar comandos:", err);
  }
})();

// Interactions
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const commandName = interaction.commandName;
  const temPermissao = STAFF_ROLES.some((r) => interaction.member.roles.cache.has(r));

  let alreadyDeferred = false;
  try {
    await interaction.deferReply({ flags: InteractionResponseFlags.Ephemeral });
    alreadyDeferred = true;

    if (commandName === "aviso") {
      const titulo = interaction.options.getString("titulo");
      const descricao = interaction.options.getString("descricao").replace(/\\n/g, "\n");
      const imagem = interaction.options.getAttachment("imagem")?.url || null;

      const embed = new EmbedBuilder().setColor(COLOR_PADRAO).setTitle(titulo).setDescription(descricao);
      if (imagem) embed.setImage(imagem);

      await interaction.channel.send({ embeds: [embed], content: `<@&${CIDADAO_ROLE}> @everyone` });
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

      let descEmbed = `**Descrição:** ${descricao}\n**Data:** ${data}\n**Horário:** ${horario}\n**Local:** ${local}`;
      if (premiacao) descEmbed += `\n**Premiação:** ${premiacao}`;
      if (observacao) descEmbed += `\n**Observação:** ${observacao}`;

      const embed = new EmbedBuilder().setColor(COLOR_PADRAO).setTitle(titulo).setDescription(descEmbed);
      if (imagem) embed.setImage(imagem);

      await interaction.channel.send({ embeds: [embed], content: `<@&${CIDADAO_ROLE}> @everyone` });
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

      await interaction.channel.send({ embeds: [embed], content: `<@&${CIDADAO_ROLE}> @everyone` });
      return interaction.editReply({ content: "✅ Atualizações enviadas!" });
    }

    if (commandName === "pix" || commandName === "pix2") {
      if (!temPermissao) return interaction.editReply({ content: "❌ Apenas STAFF." });

      const valor = interaction.options.getString("valor");
      const item = commandName === "pix" ? interaction.options.getString("produto") : interaction.options.getString("servico");
      const desconto = interaction.options.getString("desconto");

      let descricao = `<:Pix:1351222074097664111> **PIX** - ${
        commandName === "pix"
          ? "condadodoacoes@gmail.com - BANCO BRADESCO (Gabriel Fellipe de Souza)"
          : "leandro.hevieira@gmail.com"
      }\n**VALOR:** ${valor}\n**${commandName === "pix" ? "Produto" : "Serviço"}:** ${item}\n\n**Enviar o comprovante após o pagamento.**`;

      if (desconto) descricao += `\n*Desconto aplicado: ${desconto}%*`;

      const embed = new EmbedBuilder().setColor("#00FF00").setDescription(descricao);
      await interaction.channel.send({ embeds: [embed] });
      return interaction.editReply({ content: "✅ PIX enviado com sucesso!" });
    }

    if (commandName === "cargostreamer") {
      const embed = new EmbedBuilder().setColor(COLOR_PADRAO).setTitle("Seja Streamer!").setDescription(
        `Após uma semana, cumprindo os requisitos, você receberá os benefícios na cidade.\n\nReaja com <:Streamer:1353492062376558674> para receber o cargo Streamer!`
      );
      const mensagem = await interaction.channel.send({ embeds: [embed] });
      await mensagem.react("1353492062376558674");

      return interaction.editReply({ content: "✅ Mensagem de cargo enviada!" });
    }

    if (commandName === "entrevista") {
      const embed = new EmbedBuilder().setColor(COLOR_PADRAO).setTitle("Olá, visitantes!").setDescription(
        "As entrevistas já estão disponíveis. Para participar, clique no botão abaixo e um membro da equipe irá atendê-lo em breve.\n\nDesejamos boa sorte!"
      );
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Aguarde Entrevista")
          .setStyle(ButtonStyle.Link)
          .setURL("https://discord.com/channels/1120401688713502772/1179115356854439966")
      );

      await interaction.channel.send({ embeds: [embed], components: [row], content: `<@&1136131478888124526>` });
      return interaction.editReply({ content: "✅ Mensagem de entrevista enviada com sucesso!" });
    }
  } catch (err) {
    console.error("Erro em interactionCreate:", err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: "❌ Ocorreu um erro.", flags: InteractionResponseFlags.Ephemeral });
    } else {
      try {
        await interaction.editReply({ content: "❌ Ocorreu um erro." });
      } catch {}
    }
  }
});

client.login(TOKEN);
