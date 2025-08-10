import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../assets/movie.css';

const SearchMovie = () => {
  const [movieName, setMovieName] = useState('');
  const [movieData, setMovieData] = useState(null);
  const [error, setError] = useState('');
  const apiKey = 'f9b1e6ebe6809e2f826f852f064e3827'; // Replace with your TMDb API key

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const movieTitle = queryParams.get('title'); // Extract movie title from URL query parameter

  const fetchMovieDetails = async (title) => {
    if (!title) {
      setError('Movie title not provided.');
      return;
    }

    setError('');
    setMovieData(null);

    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(title)}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch movie details');
      }

      const data = await response.json();
      if (data.results && data.results.length > 0) {
        setMovieData(data.results[0]);
      } else {
        setError('No movie found with this name');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const generatePlotSetting = (movie) => {
    if (!movie || !movie.overview) {
      return 'Get ready for a cinematic experience like no other. Hold your breath as the screen brings this vision to life. Let’s begin!';
    }

    const maxLength = 500; // Limit the length of the setting
    const trimmedOverview =
      movie.overview.length > maxLength
        ? movie.overview.substring(0, maxLength) + '...'
        : movie.overview;

    return `Welcome to the world of "${movie.title}". ${trimmedOverview} Get ready for a cinematic experience like no other. Hold your breath as the screen brings this vision to life. Let’s begin!`;
  };

  const playPlotWithMusic = (plot) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      // Create a new suspenseful background music instance
      const suspenseAudio = new Audio('/suspense.mp3');
      suspenseAudio.volume = 0.3; // Adjust music volume
      suspenseAudio.loop = true; // Loop music for longer plots
      suspenseAudio.play();

      const utterance = new SpeechSynthesisUtterance(plot);
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(
        (voice) => voice.lang === 'en-GB' && voice.name === 'Google UK English Male'
      );

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.rate = 1; // Normal speed
      utterance.pitch = 1; // Normal pitch
      utterance.volume = 1; // Full volume

      // Stop the music when the speech ends
      utterance.onend = () => {
        suspenseAudio.pause();
        suspenseAudio.currentTime = 0; // Reset music for the next play
      };

      // Delay the speech by 3 seconds
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 3000);
    } else {
      alert('Sorry, your browser does not support text-to-speech functionality.');
    }
  };

  const handlePlayPlot = () => {
    if (movieData) {
      const plotSetting = generatePlotSetting(movieData);
      playPlotWithMusic(plotSetting);
    }
  };

  useEffect(() => {
    if (movieTitle) {
      setMovieName(movieTitle); // Set the movieName state
      fetchMovieDetails(movieTitle); // Fetch movie details based on URL title
    }
  }, [movieTitle]);

  useEffect(() => {
    if (movieData) {
      handlePlayPlot(); // Play the plot as soon as movie data is fetched
    }
  }, [movieData]);

  return (
    <div className="movie-details-container">
      <div className="search-box">
        {/* Removed input and button */}
      </div>
      {error && <p className="error-message">{error}</p>}
      {movieData && (
        <div className="movie-details">
          <img
            src={`https://image.tmdb.org/t/p/w500/${movieData.poster_path}`}
            alt={movieData.title}
            className="movie-poster"
          />
        </div>
      )}
    </div>
  );
};

export default SearchMovie;
