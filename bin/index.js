#! /usr/bin/env node 
import  yargs from 'yargs'
import  ytdl from 'ytdl-core';
import https from 'https';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import SpotifyWebApi from 'spotify-web-api-node';
import SpotifyToYouTubeMusic from 'spotify-to-ytmusic';
import NodeID3 from 'node-id3';



const _clientSecret = process.env.CLIENT_SECRET;
const _clientID = process.env.CLIENT_ID;

const spotifyWebApi = new SpotifyWebApi({
    clientId: `${_clientID}`,
    clientSecret: `${_clientSecret}`,
    redirectUri: "https://example.com/callback",
})

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const spotifyToYouTubeMusic = await SpotifyToYouTubeMusic ({
    clientID: `${_clientID}`,
    clientSecret: `${_clientSecret}`,
});




class SongData {
    constructor(){} 

    async getTrack() {
        const songNameArray = yargs(process.argv.splice(2)).argv._; 
        await spotifyWebApi.clientCredentialsGrant().then((data)=> {
            spotifyWebApi.setAccessToken(data.body['access_token']);
        })
        var spotifyData = await spotifyWebApi.getTrack(`${songNameArray[0].slice(31,53)}`);
        var r = spotifyData.body;
        this.trackArtist = (r.artists[0].name);
        this.trackName = r.name;
        this.trackDate = r.album.release_date;
        this.trackNumber = r.track_number;
        this.trackAlbum = r.album.name;
        this.trackID = await spotifyToYouTubeMusic(r.id); 
        this.imagePath = `${__dirname}/temp-${this.trackName}-${this.trackArtist}.jpg`
        var imageFile = fs.createWriteStream(this.imagePath);
        const req = https.get(r.album.images[0].url, response => {
            response.pipe(imageFile);
        });

        imageFile.on('finish', ()=>{
            console.log("Album Cover Downloaded");
        })

        let stream = ytdl(`${track.trackID}`, {quality:'highestaudio'})
        let start = Date.now();

        ffmpeg(stream)
        .audioBitrate(128)
        .save(`${__dirname}/${track.trackArtist}- ${track.trackName}.mp3`)
        .on('progess',p => {
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(`${p.targetSize}kb downloaded`);
        })
        .on('end', ()=>{
            var metadata = {
                title: `${this.trackName}`,
                artist: `${this.trackArtist}`,
                album: `${this.trackAlbum}`,
                APIC: `${this.imagePath}`,
                TRCK: `${this.trackNumber}`
            }
             var success  = NodeID3.write(metadata, `${__dirname}/${this.trackArtist}- ${this.trackName}.mp3`)
             
             if(success) {
                console.log("Successfully wrote metadata");
                fs.unlink(`${this.imagePath}`, err => {
                    return;
                });
             } 
            console.log(`\nSuccessfully Downloaded ${this.trackName} - ${this.trackArtist} - ${(Date.now() - start) / 1000}s`);
        }); 
    }
}




const track = new SongData();
await track.getTrack();