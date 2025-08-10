const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require('axios');
require('dotenv').config();
const { extractKeywordsBatch  } = require('./gemeni.js');
const { spawn } = require('child_process');
const path = require('path');


const app = express();
const PORT = 5000;

// Enable CORS
app.use(cors());

// Middleware to parse JSON
app.use(bodyParser.json());

// In-memory storage for demonstration purposes
let responsesStorage = [];

// Variable to store the data
let storedData = [];


// Temporary storage for the keyword mapping
let keywordMappingCache = [];

// Function to get location using IP
async function getLocation() {
  try {
    const response = await axios.get('http://ip-api.com/json/');
    const { city, country, lat, lon } = response.data;
    return { city, country, lat, lon };
  } catch (error) {
    console.error('Error fetching location:', error.message);
    return null;
  }
}

// Function to get weather details
async function getWeather(lat, lon) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

  try {
    const response = await axios.get(weatherUrl);
    const { main, weather, name } = response.data;
    return {
      condition: weather[0].description,
      temperature: main.temp,
      location: name,
    };
  } catch (error) {
    console.error('Error fetching weather:', error.message);
    return null;
  }
}

// API endpoint to fetch location and weather
app.get('/api/weather', async (req, res) => {
  const location = await getLocation();
  if (!location) {
    return res.status(500).json({ error: 'Failed to fetch location.' });
  }

  const weather = await getWeather(location.lat, location.lon);
  if (!weather) {
    return res.status(500).json({ error: 'Failed to fetch weather details.' });
  }

  res.json({
    location: `${location.city}, ${location.country}`,
    condition: weather.condition,
    temperature: `${weather.temperature}°C`,
  });
});

// POST API to save responses and extract keywords
app.post("/api/save-responses", async (req, res) => {
  const { responses } = req.body;
  console.log("save-responses", responses);
  
  if (!responses || !Array.isArray(responses)) {
    return res.status(400).json({ error: "Invalid request body. Expecting 'responses' array." });
  }

  try {
    // Extract keywords and save to cache
    const keywordMapping = await extractKeywordsBatch(responses);
    keywordMappingCache = keywordMapping; // Save to in-memory cache

    // Send success response
    res.status(200).json({ questionsAndKeywords: keywordMapping });
  } catch (error) {
    console.error("Error in saving responses:", error.message);
    res.status(500).json({ error: "Failed to process responses." });
  }
});

// Test API endpoint
app.get("/api/test", (req, res) => {
  res.send("Node.js is working!");
});

// GET API to retrieve the saved responses
app.get("/api/get-responses", (req, res) => {
  if (keywordMappingCache.length === 0) {
    return res.status(404).json({ error: "No responses found. Please save responses first." });
  }

  // Send the cached responses
  res.status(200).json({ questionsAndKeywords: keywordMappingCache });
});

// POST API to accept and store data
app.post("/api/data", (req, res) => {
  const data = req.body; // Body of the request
  console.log("Data",data);
  
  // Check if the data is an array
  if (!Array.isArray(data)) {
    return res.status(400).json({ error: "Invalid input. Expected an array." });
  }

  storedData = data; // Store the array in memory
  res.status(200).json({ message: "Data received and stored successfully." });
});

// GET API to retrieve the data
app.get("/api/data", (req, res) => {
  res.status(200).json({ data: storedData });
});

// Define the API route
app.get('/run-script', (req, res) => {
  const pyProg = spawn('python', ['../recommendation-model/recommend_movies.py'], {
    env: { ...process.env, TF_ENABLE_ONEDNN_OPTS: '0' }
  });

  let result = '';

  pyProg.stdout.on('data', (data) => {
    result += data.toString();
  });

  pyProg.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  pyProg.on('close', (code) => {
    console.log(`Child process exited with code ${code}`);
    if (code === 0) {
      res.status(200).send(result);
    } else {
      res.status(500).send('An error occurred while executing the script');
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
