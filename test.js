const https = require('https');
require('dotenv').config();

const API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
console.log('API KEY Length:', API_KEY.length);

const query = 'Salon in Rohini in Delhi in Delhi in India';

const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${API_KEY}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            console.log('Status:', parsed.status);
            console.log('Results length:', parsed.results ? parsed.results.length : 0);
            if(parsed.error_message) console.log('Error Message:', parsed.error_message);
        } catch(e) {
            console.log(data);
        }
    });
});
