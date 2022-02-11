const { MessageEmbed } = require("discord.js");

exports.run = async (client, message) => {
  const channel = message.member.voice.channel;
  if (!channel)
    return message.channel.send( new MessageEmbed()
  .setDescription("You must Join a voice channel before using this command!")
  .setColor("RED"));
  const queue = message.client.queue.get(message.guild.id);
  var status;
  var np;
  var count = 0;
  if (!queue) status = "There is nothing in queue!";
  else
    status = queue.queue
      .map((x) => {
        count += 1;
        return (
          `\`•| ${count} |•\` ${x.name} \n *Requested by:* <@${x.requested.id}>` 
        );
      })
      .join("\n");
  if (!queue) np = status;
  else np = queue.queue[0].name;
  if (queue) thumbnail = queue.queue[0].thumbnail;
  else thumbnail = message.guild.iconURL();
  message.channel.send(
    new MessageEmbed()
    
      .setAuthor(
        "Music Queue",
        "https://im2.ezgif.com/tmp/ezgif-2-3367258aed.gif"
      )
      .setThumbnail(thumbnail)
      .setColor("#965536")
      .addField("Now Playing", np, true)
      .setDescription(status)
      .setTimestamp()
  );
};

