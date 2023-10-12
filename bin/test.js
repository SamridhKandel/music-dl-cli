import spotifyToYt from "spotify-to-yt";
import 'dotenv/config';

const spotifySettings = {
    clientID : process.env.CLIENT_ID, 
    clientSecret : process.env.CLIENT_SECRET
}

console.log(await spotifyToYt.trackGet("https://open.spotify.com/track/5JRMqkR82k2fdDEAim9SCN?si=57e6d1cb6e504bf4"));