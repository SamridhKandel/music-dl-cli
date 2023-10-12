#! /usr/bin/env node 
import  yargs from 'yargs'
import  ytdl from 'ytdl-core';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import fetch from 'node-fetch';
import spotify from 'spotify-url-info';
import SpotifyToYouTubeMusic from 'spotify-to-ytmusic';




const clientSecret = process.env.CLIENT_SECRET;
const clientID = process.env.CLIENT_ID;
console.log(clientSecret);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const spotifyToYouTubeMusic = await SpotifyToYouTubeMusic ({
    clientID: `${clientID}`,
    clientSecret: `${clientSecret}`,
});




class SongData {
    constructor(){} 

    async getTrackData() {
        const songNameArray = yargs(process.argv.splice(2)).argv._; 
        var data = spotify(fetch);
        var r =  await data.getPreview(songNameArray[0]);
        this.trackName = r.title;
        this.trackArtist = r.artist;
        this.trackID = await spotifyToYouTubeMusic(songNameArray[0]);
        console.log(r);
    }
        
}


const track = new SongData();
await track.getTrackData();
console.log(track);


let stream = ytdl(`${track.trackID.slice(28)}`, {quality:'highestaudio'})
console.log(stream);
let start = Date.now();

ffmpeg(stream)
.audioBitrate(128)
.save(`${__dirname}/${track.trackArtist}- ${track.trackName}}.mp3`)
.on('progess',p => {
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(`${p.targetSize}kb downloaded`);
})
.on('end', ()=>{
    console.log(`\ndone, thanks - ${(Date.now() - start) / 1000}s`);
});


