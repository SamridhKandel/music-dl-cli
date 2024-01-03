#! /usr/bin/env node
import yargs from "yargs";
import ytdl from "ytdl-core";
import https from "https";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import path, { resolve } from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import SpotifyWebApi from "spotify-web-api-node";
import SpotifyToYouTubeMusic from "spotify-to-ytmusic";
import NodeID3 from "node-id3";
import { homedir } from "os";
import progress from "progress";
import ProgressBar from "progress";

const _clientSecret = process.env.CLIENT_SECRET;
const _clientID = process.env.CLIENT_ID;

const spotifyWebApi = new SpotifyWebApi({
  clientId: `${_clientID}`,
  clientSecret: `${_clientSecret}`,
  redirectUri: "https://example.com/callback",
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.join(homedir(), "Music");

const spotifyToYouTubeMusic = await SpotifyToYouTubeMusic({
  clientID: `${_clientID}`,
  clientSecret: `${_clientSecret}`,
});

await spotifyWebApi.clientCredentialsGrant().then((data) => {
  spotifyWebApi.setAccessToken(data.body["access_token"]);
});

class Playlist {
  constructor() {}

  async getPlaylistInfo() {
    var playlistSongsArray = new Array();
    const playlist = yargs(process.argv.splice(2)).argv._;
    var playlistID = playlist[0].slice(34, 56);
    console.log("playlistId: " + playlistID);
    var spotifyData = await spotifyWebApi.getPlaylist(playlistID);
    var r = spotifyData.body;
    var i = 0;
    r.tracks.items.forEach(() => {
      playlistSongsArray.push(r.tracks.items[i].track.id);
      i++;
    });
    return playlistSongsArray;
  }
}

class Song {
  constructor() {}

  async getTrack(spotifyID) {
    try {
      return new Promise(async (resolve, reject) => {
        var spotifyData = await spotifyWebApi.getTrack(spotifyID);
        var r = spotifyData.body;
        this.trackArtist = r.artists[0].name;
        this.trackName = r.name;
        this.trackDate = r.album.release_date;
        this.trackNumber = r.track_number;
        this.trackAlbum = r.album.name;
        this.trackID = await spotifyToYouTubeMusic(r.id);
        this.imagePath = `${__dirname}/temp-${this.trackName}-${this.trackArtist}.jpg`;
        var imageFile = fs.createWriteStream(this.imagePath);
        const req = https.get(r.album.images[0].url, (response) => {
          response.pipe(imageFile);
        });

        imageFile.on("finish", () => {
          console.log("Album Cover Downloaded");
        });
        let stream = ytdl(`${this.trackID}`, { quality: "highestaudio" }).on(
          "error",
          (err) => {
            console.log("Error Downloading Track" + err);
            resolve();
          }
        );

        let start = Date.now();

        try {
          ffmpeg(stream)
            .audioBitrate(128)
            .save(`${__dirname}/${this.trackArtist}- ${this.trackName}.mp3`)
            .on("progress", (p) => {
              let len = parseInt(p.targetSize, 10);
              let bar = new progress(
                "downloading [:bar] :rate/bps :percent :etas",
                {
                  complete: "=",
                  incomplete: " ",
                  width: 20,
                  total: len,
                }
              );
              process.stdout.write(`${p.targetSize}kb downloaded`);
              bar.tick(p.length);
            })

            .on("end", () => {
              var metadata = {
                title: `${this.trackName}`,
                artist: `${this.trackArtist}`,
                album: `${this.trackAlbum}`,
                APIC: `${this.imagePath}`,
                TRCK: `${this.trackNumber}`,
              };
              var success = NodeID3.write(
                metadata,
                `${__dirname}/${this.trackArtist}- ${this.trackName}.mp3`
              );

              if (success) {
                console.log("Successfully wrote metadata");
                fs.unlink(`${this.imagePath}`, (err) => {
                  return;
                });
              }
              resolve();
              console.log(
                `\nSuccessfully Downloaded ${this.trackName} - ${
                  this.trackArtist
                } - ${(Date.now() - start) / 1000}s`
              );
            })
            .on("error", () => {
              console.log("Error!!!");
              fs.unlink(`${this.imagePath}`, (err) => {
                return;
              });
              resolve();
            });
        } catch (err) {
          console.error("Error downloading track:", err);
          resolve();
        }
      });
    } catch (error) {
      log("error downloading track");
    }
  }
}

const playlist = new Playlist();
var z = new Song();
var arr = await playlist.getPlaylistInfo();
for (const songs of arr) {
  try {
    await z.getTrack(songs);
  } catch (error) {
    console.error("error");
    resolve();
  }
}
