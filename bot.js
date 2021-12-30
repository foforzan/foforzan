const Discord = require("discord.js");
const client = new Discord.Client();
const ayarlar = require("./ayarlar.json");
const chalk = require("chalk");
const fs = require("fs");
const moment = require("moment");
const Jimp = require("jimp");
const db = require("quick.db");
const data = require("quick.db");
const token = process.env.token;
const database = require("quick.db");
const ms = require("ms");
var prefix = ayarlar.prefix;

client.on("ready", () => {
  console.log(`Bot suan bu isimle aktif: ${client.user.tag}!`);
});

const log = message => {
  console.log(`[${moment().format("YYYY-MM-DD HH:mm:ss")}] ${message}`);
};

///////////// KOMUTLAR BAŞ

client.on("ready", () => {
  client.guilds.cache.forEach(guild => {
    guild.members.cache.forEach(async member => {
      const fetch = await database.fetch(member.user.id);
      if (!fetch) return;
      if (Date.now() <= fetch.end || fetch) {
        let kalan = fetch.end - Date.now();
        let logChannelID = ayarlar.muteLogKanalID;
        let logChannel = await guild.channels.cache.get(logChannelID);
        setTimeout(() => {
          const embed = new Discord.MessageEmbed().setAuthor(
            fetch.moderatorUsername,
            fetch.moderatorAvatarURL
          );
          return member.roles.remove(ayarlar.mutedRolID).then(
            () =>
              database.delete(member.user.id) &&
              logChannel.send(
                embed.setColor("GREEN").setTitle("Susturulması açıldı.")
                  .setDescription(`**• Moderatör**: <@!${fetch.moderatorID}>
**• Susturulan**: <@!${member.user.id}>
**• Sebep**: ${fetch.reason}`)
              )
          );
        }, kalan);
      }
    });
  });
});

client.on("guildMemberAdd", async member => {
  let mute = member.guild.roles.cache.find(
    r => r.name === ayarlar.mutedRolİsim
  );
  let mutelimi = db.fetch(`muteli_${member.guild.id + member.id}`);
  let süre = db.fetch(`süre_${member.id + member.guild.id}`);
  if (!mutelimi) return;
  if (mutelimi == "muteli") {
    member.roles.add(ayarlar.mutedRolID);

    member.send("Muteliyken Sunucudan Çıktığın için Yeniden Mutelendin!");
    setTimeout(function() {
      // msg.channel.send(`<@${user.id}> Muten açıldı.`)
      db.delete(`muteli_${member.guild.id + member.id}`);
      member.send(`<@${member.id}> Muten açıldı.`);
      member.roles.remove(ayarlar.mutedRolID);
    }, ms(süre));
  }
});

client.on("message", async message => {
  if (message.channel.type === "dm") return;
  if (
    (await data.fetch(`afk.${message.author.id}.${message.guild.id}`)) ==
    undefined
  )
    return;
  const ms = require("ms");

  if (message.content.length > 2) {
    const sebepp = await data.fetch(
      `sebep.${message.author.id}.${message.guild.id}`
    );
    const sp = await data.fetch(
      `giriş.${message.author.id}.${message.guild.id}`
    );
    const asd = await data.fetch(
      `display.${message.author.id}.${message.guild.id}`
    );

    let atılmaay = moment(Date.now() + 10800000).format("MM");
    let atılmagün = moment(Date.now() + 10800000).format("DD");
    let atılmasaat = moment(Date.now() + 10800000).format("HH:mm:ss");
    let atılma = `\`${atılmagün} ${atılmaay
      .replace(/01/, "Ocak")
      .replace(/02/, "Şubat")
      .replace(/03/, "Mart")
      .replace(/04/, "Nisan")
      .replace(/05/, "Mayıs")
      .replace(/06/, "Haziran")
      .replace(/07/, "Temmuz")
      .replace(/08/, "Ağustos")
      .replace(/09/, "Eylül")
      .replace(/10/, "Ekim")
      .replace(/11/, "Kasım")
      .replace(/12/, "Aralık")} ${atılmasaat}\``;

    message.guild.members.cache.get(message.author.id).setNickname(asd);
    message.channel.send(
      new Discord.MessageEmbed()
        .setTitle(`${message.author.username}, hoşgeldin!`)
        .setColor("GREEN")
        .setDescription(`Afk modundan başarıyla çıkış yaptın.`)
        .addField("Giriş sebebin:", sebepp)
        .addField("AFK olma zamanın:", sp)
        .addField("Çıkış zamanın:", atılma)
    );
    data.delete(`afk.${message.author.id}.${message.guild.id}`);
    data.delete(`sebep.${message.author.id}.${message.guild.id}`);
    data.delete(`giriş.${message.author.id}.${message.guild.id}`);
    data.delete(`display.${message.author.id}.${message.guild.id}`);
  }
});

client.on("guildMemberAdd", async member => {
  let rol = member.guild.roles.cache.find(
    r => r.name === ayarlar.jailedRolİsim
  );
  let cezalımı = db.fetch(`cezali_${member.guild.id + member.id}`);
  let sürejail = db.fetch(`süreJail_${member.id + member.guild.id}`);
  if (!cezalımı) return;
  if (cezalımı == "cezali") {
    member.roles.add(ayarlar.jailedRolID);

    member.send(
      "Cezalıyken Sunucudan Çıktığın için Yeniden Cezalı Rolü Verildi!"
    );
    setTimeout(function() {
      // msg.channel.send(`<@${user.id}> Muten açıldı.`)
      db.delete(`cezali_${member.guild.id + member.id}`);
      member.send(`<@${member.id}> Cezan açıldı.`);
      member.roles.remove(ayarlar.jailedRolID);
    }, ms(sürejail));
  }
});

client.on("messageDelete", message => {
  const anan = require("quick.db");
  anan.set(`snipe.mesaj.${message.guild.id}`, message.content);
  anan.set(`snipe.id.${message.guild.id}`, message.author.id);
});

///////////////////// TAG ROL /////////////////////////////////

client.on("userUpdate", async (oldUser, newUser) => {
  if (oldUser.username !== newUser.username) {
    const tag = ayarlar.tag;
    const sunucu = ayarlar.sunucuID;
    const kanal = ayarlar.tagRolLogID;
    const rol = ayarlar.tagRolID;

    try {
      if (
        newUser.username.includes(tag) &&
        !client.guilds.cache
          .get(sunucu)
          .members.cache.get(newUser.id)
          .roles.cache.has(rol)
      ) {
        await client.channels.cache
          .get(kanal)
          .send(
            new Discord.MessageEmbed()
              .setColor("GREEN")
              .setDescription(
                `${newUser} ${tag} Tagımızı Aldığı İçin <@&${rol}> Rolünü Verdim`
              )
          );
        await client.guilds.cache
          .get(sunucu)
          .members.cache.get(newUser.id)
          .roles.add(rol);
        await client.guilds.cache
          .get(sunucu)
          .members.cache.get(newUser.id)
          .send(
            `Selam ${
              newUser.username
            }, Sunucumuzda ${tag} Tagımızı Aldığın İçin ${
              client.guilds.cache.get(sunucu).roles.cache.get(rol).name
            } Rolünü Sana Verdim!`
          );
      }
      if (
        !newUser.username.includes(tag) &&
        client.guilds.cache
          .get(sunucu)
          .members.cache.get(newUser.id)
          .roles.cache.has(rol)
      ) {
        await client.channels.cache
          .get(kanal)
          .send(
            new Discord.MessageEmbed()
              .setColor("RED")
              .setDescription(
                `${newUser} ${tag} Tagımızı Çıkardığı İçin <@&${rol}> Rolünü Aldım`
              )
          );
        await client.guilds.cache
          .get(sunucu)
          .members.cache.get(newUser.id)
          .roles.remove(rol);
        await client.guilds.cache
          .get(sunucu)
          .members.cache.get(newUser.id)
          .send(
            `Selam **${
              newUser.username
            }**, Sunucumuzda ${tag} Tagımızı Çıkardığın İçin ${
              client.guilds.cache.get(sunucu).roles.cache.get(rol).name
            } Rolünü Senden Aldım!`
          );
      }
    } catch (e) {
      console.log(`Bir hata oluştu! ${e}`);
    }
  }
});

///////////////////// TAG ROL ////////////////////////////////

////////////// KOMUTLAR SON
////////////// ALTI ELLEME
require("./util/eventLoader")(client);

client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
fs.readdir("./komutlar/", (err, files) => {
  if (err) console.error(err);
  log(`${files.length} komut yüklenecek.`);
  files.forEach(f => {
    let props = require(`./komutlar/${f}`);
    log(`Yüklenen komut: ${props.help.name}`);
    client.commands.set(props.help.name, props);
    props.conf.aliases.forEach(alias => {
      client.aliases.set(alias, props.help.name);
    });
  });
});

client.reload = command => {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./komutlar/${command}`)];
      let cmd = require(`./komutlar/${command}`);
      client.commands.delete(command);
      client.aliases.forEach((cmd, alias) => {
        if (cmd === command) client.aliases.delete(alias);
      });
      client.commands.set(command, cmd);
      cmd.conf.aliases.forEach(alias => {
        client.aliases.set(alias, cmd.help.name);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

client.load = command => {
  return new Promise((resolve, reject) => {
    try {
      let cmd = require(`./komutlar/${command}`);
      client.commands.set(command, cmd);
      cmd.conf.aliases.forEach(alias => {
        client.aliases.set(alias, cmd.help.name);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

client.unload = command => {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./komutlar/${command}`)];
      let cmd = require(`./komutlar/${command}`);
      client.commands.delete(command);
      client.aliases.forEach((cmd, alias) => {
        if (cmd === command) client.aliases.delete(alias);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

client.elevation = message => {
  if (!message.guild) {
    return;
  }
  let permlvl = 0;
  if (message.member.hasPermission("BAN_MEMBERS")) permlvl = 2;
  if (message.member.hasPermission("ADMINISTRATOR")) permlvl = 3;
  if (ayarlar.sahip.includes(message.author.id)) permlvl = 4;
  return permlvl;
};

var regToken = /[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g;
// client.on('debug', e => {
//   console.log(chalk.bgBlue.green(e.replace(regToken, 'that was redacted')));
// });

client.on("warn", e => {
  console.log(chalk.bgYellow(e.replace(regToken, "that was redacted")));
});

client.on("error", e => {
  console.log(chalk.bgRed(e.replace(regToken, "that was redacted")));
});

client.login(process.env.TOKEN);
//ses
client.on("ready", () => {
  client.channels.cache.get(process.env.ses).join();
});
//hg

const invites = {};
const wait = require("util").promisify(setTimeout);
client.on("ready", () => {
  wait(1000);
  client.guilds.cache.forEach(g => {
    g.fetchInvites().then(guildInvites => {
      invites[g.id] = guildInvites;
    });
  });
});

client.on("guildMemberAdd", member => {
  if (member.user.bot) return;

  member.guild.fetchInvites().then(async guildInvites => {
    const ei = invites[member.guild.id];

    invites[member.guild.id] = guildInvites;

    const invite = await guildInvites.find(
      i => (ei.get(i.code) == null ? i.uses - 1 : ei.get(i.code).uses) < i.uses
    );

    const daveteden = member.guild.members.cache.get(invite.inviter.id);

    db.add(`davet_${invite.inviter.id}_${member.guild.id}`, +1);

    db.set(`bunudavet_${member.id}`, invite.inviter.id);

    let davetsayiv2 = await db.fetch(
      `davet_${invite.inviter.id}_${member.guild.id}`
    );

    let davetsayi;

    if (!davetsayiv2) davetsayi = 0;
    else
      davetsayi = await db.fetch(
        `davet_${invite.inviter.id}_${member.guild.id}`
      );
    let date = moment(member.user.createdAt);
    const startedAt = Date.parse(date);
    var msecs = Math.abs(new Date() - startedAt);

    const years = Math.floor(msecs / (1000 * 60 * 60 * 24 * 365));
    msecs -= years * 1000 * 60 * 60 * 24 * 365;
    const months = Math.floor(msecs / (1000 * 60 * 60 * 24 * 30));
    msecs -= months * 1000 * 60 * 60 * 24 * 30;
    const weeks = Math.floor(msecs / (1000 * 60 * 60 * 24 * 7));
    msecs -= weeks * 1000 * 60 * 60 * 24 * 7;
    const days = Math.floor(msecs / (1000 * 60 * 60 * 24));
    msecs -= days * 1000 * 60 * 60 * 24;
    const hours = Math.floor(msecs / (1000 * 60 * 60));
    msecs -= hours * 1000 * 60 * 60;
    const mins = Math.floor(msecs / (1000 * 60));
    msecs -= mins * 1000 * 60;
    const secs = Math.floor(msecs / 1000);
    msecs -= secs * 1000;

    var string = "";
    if (years > 0) string += `${years} yıl ${months} ay`;
    else if (months > 0)
      string += `${months} ay ${weeks > 0 ? weeks + " hafta" : ""}`;
    else if (weeks > 0)
      string += `${weeks} hafta ${days > 0 ? days + " gün" : ""}`;
    else if (days > 0)
      string += `${days} gün ${hours > 0 ? hours + " saat" : ""}`;
    else if (hours > 0)
      string += `${hours} saat ${mins > 0 ? mins + " dakika" : ""}`;
    else if (mins > 0)
      string += `${mins} dakika ${secs > 0 ? secs + " saniye" : ""}`;
    else if (secs > 0) string += `${secs} saniye`;

    string = string.trim();

    let guild = member.client.guilds.cache.get("923988672414638110");
    let log = guild.channels.cache.get("924592922555473930");
    let endAt = member.user.createdAt;
    let gün = moment(new Date(endAt).toISOString()).format("DD");
    let ay = moment(new Date(endAt).toISOString())
      .format("MM")
      .replace("01", "Ocak")
      .replace("02", "Şubat")
      .replace("03", "Mart")
      .replace("04", "Nisan")
      .replace("05", "Mayıs")
      .replace("06", "Haziran")
      .replace("07", "Temmuz")
      .replace("08", "Ağustos")
      .replace("09", "Eylül")
      .replace("10", "Ekim")
      .replace("11", "Kasım")
      .replace("12", "Aralık");
    let yıl = moment(new Date(endAt).toISOString()).format("YYYY");
    let saat = moment(new Date(endAt).toISOString()).format("HH:mm");
    let kuruluş = `${gün} ${ay} ${yıl} ${saat}`;
    log.send(`
<a:muahh:924587997939236876> ${member} Sunucumuza hoş eyç! 
   
Hesabın **${kuruluş} (${string})** önce oluşturulmuş.
   
Sunucu <#924015463468523591> kanalında bakmayı unutma kardej! ||<@&924335838786121758>||
  
   
Seninle birlikte **${member.guild.memberCount}** üyeye ulaştık!
**Davet eden:** ${daveteden} \`${davetsayi}.\` davetini gerçekleştirdi.`);
  });
});
client.on("guildMemberRemove", async member => {
  let davetçi = await db.fetch(`bunudavet_${member.id}`);

  const daveteden = member.guild.members.cache.get(davetçi);

  db.add(`davet_${davetçi}_${member.guild.id}`, -1);
});

//seviye
client.cooldown = new Discord.Collection();
client.config = {
  cooldown: 1 * 1000
};
client.db = require("quick.db");
client.on("message", async message => {
  if (!message.guild || message.author.bot) return;
  // XP
  exp(message);
  function exp(message) {
    if (
      !client.cooldown.has(`${message.author.id}`) ||
      Date.now() - client.cooldown.get(`${message.author.id}`) >
        client.config.cooldown
    ) {
      let exp = client.db.add(`exp_${message.author.id}`, 1);
      let level = Math.floor(0.3 * Math.sqrt(exp));
      let lvl =
        client.db.get(`level_${message.author.id}`) ||
        client.db.set(`level_${message.author.id}`, 1);
      if (level > lvl) {
        let newLevel = client.db.set(`level_${message.author.id}`, level);
        message.channel.send(
          `:tada: ${message.author.toString()}, Level atladın yeni levelin ${newLevel}!`
        );
      }
      client.cooldown.set(`${message.author.id}`, Date.now());
    }
  }
});
