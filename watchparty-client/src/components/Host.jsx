import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../assets/movie.css';

const Host = () => {
  const [movieData, setMovieData] = useState(null);
  const [error, setError] = useState('');
  const [hasPlayed, setHasPlayed] = useState(false);
  const [voices, setVoices] = useState([]);
  const apiKey = 'f9b1e6ebe6809e2f826f852f064e3827';

  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const movieTitle = queryParams.get('title');

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

    return `Ah, you've picked "${movie.title}"—a truly great choice! Here's a glimpse into the story waiting for you: ${movie.overview} Buckle up and immerse yourself in this cinematic masterpiece. Let the adventure begin!`;
  };

  const playPlotWithMusic = (plot) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();


      const utterance = new SpeechSynthesisUtterance(plot);
      const selectedVoice = voices.find(
        (voice) => voice.lang === 'en-GB' && voice.name === 'Google UK English Male'
      );

      utterance.voice = selectedVoice || voices[0]; // Fallback to first voice
      utterance.rate = 1; // Normal speed
      utterance.pitch = 1; // Normal pitch
      utterance.volume = 1; // Full volume

      // Stop music and navigate after speech ends
      utterance.onend = () => {
        setHasPlayed(true);
        navigate('/player');
      };

      // Handle speech synthesis errors
      utterance.onerror = (e) => {
        console.error('Speech synthesis error:', e);
      };

      // Speak the plot
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Sorry, your browser does not support text-to-speech functionality.');
    }
  };

  useEffect(() => {
    const loadVoices = () => {
      const voiceList = window.speechSynthesis.getVoices();
      setVoices(voiceList);
    };

    // Load voices on component mount
    loadVoices();

    // Update voice list if it changes (some browsers require this)
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  useEffect(() => {
    if (movieTitle) {
      fetchMovieDetails(movieTitle);
    }
  }, [movieTitle]);

  useEffect(() => {
    if (movieData && !hasPlayed) {
      const plotSetting = generatePlotSetting(movieData);
      playPlotWithMusic(plotSetting);
    }
  }, [movieData, hasPlayed]);

  return (
    <div className="movie-details-container">
      {error && <p className="error-message">{error}</p>}
      {movieData && (
        <div className="movie-details">
          <div className="flex justify-center items-center h-40 mt-[14rem]">
            <img src="speech.gif" alt="Speaking" className="h-90 w-90" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Host;
