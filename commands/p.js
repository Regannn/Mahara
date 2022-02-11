const ytdl = require("discord-ytdl-core");
const youtubeScraper = require("yt-search");
const yt = require("ytdl-core");
const { MessageEmbed, Util } = require("discord.js");
const forHumans = require("../utils/forhumans.js");

exports.run = async (client, message, args) => {
  const channel = message.member.voice.channel;

  const error = (err) => message.channel.send(err);
  const send = (content) => message.channel.send(content);
  const setqueue = (id, obj) => message.client.queue.set(id, obj);
  const deletequeue = (id) => message.client.queue.delete(id);
  var song;

  if (!channel) return error(new MessageEmbed()
  .setDescription("You must join a voice channel to play music!")
  .setColor("RED"));

  if (!channel.permissionsFor(message.client.user).has("CONNECT"))
    return error( new MessageEmbed()
    .setDescription("I don't have permission to join the voice channel")
    .setColor("RED"));

  if (!channel.permissionsFor(message.client.user).has("SPEAK"))
    return error("I don't have permission to speak in the voice channel");

  const query = args.join(" ");

  if (!query) return error( new MessageEmbed()
  .setDescription("I don't have permission to speak in the voice channel")
  .setColor("RED"));

  if (query.includes("www.youtube.com")) {
    try {
      const ytdata = await await yt.getBasicInfo(query);
      if (!ytdata) return error(  new MessageEmbed()
      .setDescription("No song found for the url provided")
      .setColor("RED"));
    
      song = {
        name: Util.escapeMarkdown(ytdata.videoDetails.title),
        thumbnail:
          ytdata.player_response.videoDetails.thumbnail.thumbnails[0].url,
        requested: message.author,
        videoId: ytdata.videoDetails.videoId,
        duration: forHumans(ytdata.videoDetails.lengthSeconds),
        url: ytdata.videoDetails.video_url,
        views: ytdata.videoDetails.viewCount,
      };
    } catch (e) {
      console.log(e);
      return error(  new MessageEmbed()
      .setDescription("Error occured, please check console")
      .setColor("RED"));
    }
  } else {
    try {
      const fetched = await (await youtubeScraper(query)).videos;
      if (fetched.length === 0 || !fetched)
        return error(  new MessageEmbed()
        .setDescription("I couldn't find the song you requested!")
        .setColor("RED"));
      
      const data = fetched[0];
      song = {
        name: Util.escapeMarkdown(data.title),
        thumbnail: data.image,
        requested: message.author,
        videoId: data.videoId,
        duration: data.duration.toString(),
        url: data.url,
        views: data.views,
      };
    } catch (err) {
      console.log(err);
      return error("An error occured, Please check console");
    }
  }

  var list = message.client.queue.get(message.guild.id);

  if (list) {
    list.queue.push(song);
    return send(
      new MessageEmbed()
        .setAuthor(
          "The song has been added to the queue",
          "https://im2.ezgif.com/tmp/ezgif-2-d5e2253c72.gif"
        )

        .setColor("#965536")
        .setThumbnail(song.thumbnail)
        .setTitle('Song Name')
        .setDescription(song.name, false)
        .addField("Requested By", song.requested.tag, true)
        .addField("Duration", song.duration, true)
        .setFooter("Positioned " + list.queue.length + " In the queue")
        .setTimestamp()
    );
  }

  const structure = {
    channel: message.channel,
    vc: channel,
    volume: 85,
    playing: true,
    queue: [],
    connection: null,
  };

  setqueue(message.guild.id, structure);
  structure.queue.push(song);

  try {
    const join = await channel.join();
    structure.connection = join;
    play(structure.queue[0]);
  } catch (e) {
    console.log(e);
    deletequeue(message.guild.id);
    return error("I couldn't join the voice channel, Please check console");
  }

  async function play(track) {
    try {
      const data = message.client.queue.get(message.guild.id);
      if (!track) {
        data.channel.send(new MessageEmbed()
        .setDescription("Queue is empty, Leaving voice channel")
        .setColor("#965536"));
        message.guild.me.voice.channel.leave();
        return deletequeue(message.guild.id);
      }
      data.connection.on("disconnect", () => deletequeue(message.guild.id));
      const source = await ytdl(track.url, {
        filter: "audioonly",
        quality: "highestaudio",
        highWaterMark: 1 << 25,
        opusEncoded: true,
      });
      const player = data.connection
        .play(source, { type: "opus" })
        .on("finish", () => {
          var removed = data.queue.shift();
          if(data.loop == true){
            data.queue.push(removed)
          }
          play(data.queue[0]);
        });
      player.setVolumeLogarithmic(data.volume / 100);
      data.channel.send(
        new MessageEmbed()
          .setAuthor(
            "Started Playing",
            "https://im2.ezgif.com/tmp/ezgif-2-d5e2253c72.gif"
          )
          .setColor("#965536")
          .setThumbnail(track.thumbnail)
          .setTitle('Song Name')
          .setDescription(track.name, false)
          .addField("Requested By", track.requested,  true)
          .addField("Duration", track.duration,  true)
          .setFooter("Youtube Music Player")
          .setTimestamp()
      );

    } catch (e) {
      console.error(e);
    }
  }
};
