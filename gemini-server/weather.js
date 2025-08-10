require('dotenv').config();
const axios = require('axios');

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

// Main function
async function main() {
  const location = await getLocation();
  if (!location) return;

  const weather = await getWeather(location.lat, location.lon);
  if (!weather) return;

  console.log(
    `Weather in (${location.city}, ${location.country}):`
  );
  console.log(`Condition: ${weather.condition}`);
//   console.log(`Temperature: ${weather.temperature}°C`);
}

main();
