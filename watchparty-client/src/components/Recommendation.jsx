import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { IoPlayCircleSharp } from "react-icons/io5";
import { AiOutlinePlus } from "react-icons/ai";
import { RiThumbUpFill, RiThumbDownFill } from "react-icons/ri";
import "../assets/Recommendation.css";
import "../App.css";

const Recommendation = () => {
  const [loading, setLoading] = useState(true);
  const [currentMessage, setCurrentMessage] = useState("");
  const [movies, setMovies] = useState([]); // Movie data state
  const [error, setError] = useState(null);

  const messages = [
    "Preparing your data...",
    "Getting the best recommendations for you...",
    "Fetching movie details...",
    "Almost ready...",
  ];

  const TMDB_API_KEY = "f9b1e6ebe6809e2f826f852f064e3827"; // Replace with your TMDB API key

  // Fetch movie details from TMDB API
  const fetchMovieDetails = async (titles) => {
    try {
      const fetchPromises = titles.map(async (title) => {
        const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
          title
        )}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const movie = data.results[0];
          return {
            id: movie.id,
            title: movie.title,
            poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
            overview: movie.overview,
            genres: ["Action", "Drama", "Sci-Fi"], // Dummy genres
          };
        }
        return { title, poster: null, overview: "No details found" };
      });
      const movieDetails = await Promise.all(fetchPromises);
      return movieDetails;
    } catch (error) {
      console.error("Error fetching TMDB details:", error);
      return [];
    }
  };

  // Handle the loader and messages
  useEffect(() => {
    let messageIndex = 0;

    // Cycle through messages every 3 seconds
    const messageInterval = setInterval(() => {
      setCurrentMessage(messages[messageIndex]);
      messageIndex = (messageIndex + 1) % messages.length;
    }, 3000);

    // Hide loader after 20 seconds
    const loaderTimeout = setTimeout(() => {
      setLoading(false);
      clearInterval(messageInterval);
    }, 30000);

    // Cleanup on unmount
    return () => {
      clearInterval(messageInterval);
      clearTimeout(loaderTimeout);
    };
  }, []);

  // Fetch data after loader finishes
  useEffect(() => {
    if (!loading) {
      const fetchData = async () => {
        try {
          // Step 1: Fetch titles
          const response = await fetch("http://localhost:5000/api/data");
          if (!response.ok) throw new Error("Failed to fetch data");
          const result = await response.json();
          const titles = result.data.map((item) => item.title);

          // Step 2: Fetch movie details
          const movieDetails = await fetchMovieDetails(titles);
          setMovies(movieDetails);
        } catch (err) {
          setError("Failed to load movie data.");
        }
      };

      fetchData();
    }
  }, [loading]);

  return (
    <div>
      {loading ? (
        <div className="loader-container">
          <div className="blinking-text">{currentMessage}</div>
          <div className="loader-background">
            <div className="progress-bar">
              <div className="progress"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="recommendation-content mt-[2rem]">
          <h1 className="text-white font-bold text-[2.5rem] mb-[2rem]">
            Movie Recommendations
          </h1>
          {error ? (
            <p>{error}</p>
          ) : (
            <MovieGrid>
              {movies.map((movie, index) => (
                <Card key={index} movieData={movie} />
              ))}
            </MovieGrid>
          )}
        </div>
      )}
    </div>
  );
};

// Card Component (reused with hover and styling)
const Card = ({ movieData }) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate(`/host?title=${encodeURIComponent(movieData.title)}`);
  };

  return (
    <Container
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={movieData.poster || "https://via.placeholder.com/200x300"}
        alt={movieData.title}
        onClick={handleNavigate}
      />
      {isHovered && (
        <div className="hover">
          <img
            src={movieData.poster || "https://via.placeholder.com/200x300"}
            alt={movieData.title}
            onClick={handleNavigate}
          />
          <div className="info-container">
            <h3>{movieData.title}</h3>
            <div className="icons">
              <IoPlayCircleSharp title="Play" onClick={handleNavigate} />
              <RiThumbUpFill title="Like" />
              <RiThumbDownFill title="Dislike" />
              <AiOutlinePlus title="Add to my list" />
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

// Styled-components
const MovieGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 1.5rem;
`;

const Container = styled.div`
  position: relative;
  width: 250px;
  cursor: pointer;

  img {
    width: 100%;
    border-radius: 0.3rem;
  }

  h1 {
    margin-left: 50px;
  }

  .hover {
    position: absolute;
    top: 0vh;
    width: 100%;
    background-color: #181818;
    border-radius: 0.3rem;
    box-shadow: rgba(0, 0, 0, 0.75) 0px 3px 10px;

    .image-video-container img {
      width: 100%;
      height: 140px;
      border-radius: 0.3rem 0.3rem 0 0;
    }

    .info-container {
      padding: 1rem;
      h3 {
        margin-bottom: 0.5rem;
        color: white;
        font-weight: bold;
        text-align: left;
      }

      .icons {
        display: flex;
        gap: 1rem;

        svg {
          font-size: 1.8rem;
          color: white;
          transition: 0.3s ease-in-out;

          &:hover {
            color: #b8b8b8;
          }
        }
      }
    }
  }
`;

export default Recommendation;
