var http = require('http');
var axios = require('axios')
var express = require('express')
var fs = require('fs')
const port = 3000
const app = express()
var request = require('request');

const top_50_playlist_id = '37i9dQZEVXbLnolsZ8PSNw';


function token_call(callback) {
    var client_data = JSON.parse(fs.readFileSync('client.secret'))

    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: {
            'Authorization': 'Basic ' + (Buffer.from(client_data['client_id'] + ':' + client_data['client_secret']).toString('base64'))
        },
        form: {
            grant_type: 'client_credentials'
        },
        json: true
    };

    request.post(authOptions, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            var token = body.access_token;
            console.log('Token acquired');
            callback(token);
        }
    });

}
app.get('/refresh_db', async (req, res) => {
    //fetch from api
    //save list of values to a txt
    /*
    curl -X "GET"  -H  -H "Content-Type: application/json" -H
     */

    token_call(async function (token) {
        options = {
            method: 'GET',
            url: "https://api.spotify.com/v1/playlists/37i9dQZEVXbLnolsZ8PSNw/tracks",

            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }

        }
        await axios.request(options).then(function (response) {
            data = ''
            response.data.items.forEach((item) => {
                data += item.track.id + '\n';

            })
            data = data
            fs.writeFile('tracks_db.secret', data, (err) => {
                if (err)
                    console.log(err)
                else
                    console.log('DB updated')
                res.send('Refreshing db ...')
            })
        })


    })



});
function hintify(name){
    output = name.charAt(0)
    for (let n = 1; n< name.length-2; n++){
        if (name.charAt(n) == ' ')
            output+= ' '
        else
            output+='_'
    }
    output += name.charAt(name.length-1)
    return output
}
app.get('/', async (req, res) => {
    data = fs.readFileSync('tracks_db.secret').toString()
    song_ids = data.split('\n')
    song_id = song_ids[Math.floor(Math.random() * song_ids.length)]

    token_call(async function (token) {
        let options = {
            method: 'GET',
            url: "https://api.spotify.com/v1/tracks/"+song_id,

            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        }
        await axios.request(options).then(function (response) {
            var hint_1 = 'The album is '+response.data.album.name
            if (response.data.album.name == response.data.name){
                hint_1 = 'The song name is.. ' + hintify(response.data.name)
            }
            res.json({
                'answer':response.data.name,
                'hint_1':hint_1,
                'hint_2':'The artist is ' + response.data.artists[0].name,
                'hint_3':response.data.album.images[0].url,
                'error':''
            })
        }).catch((err)=>{

            res.json({
                'answer':null,
                'hint_1':null,
                'hint_2':null,
                'hint_3':null,
                'error' : err
            })
        })
    })


});


app.listen(port, () => {
    console.log(`Spotify DB API has started on port ${port}`)
})