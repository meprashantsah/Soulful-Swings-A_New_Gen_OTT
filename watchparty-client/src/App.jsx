import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes, useNavigate } from "react-router-dom";
import WatchParty from "./components/WatchParty";
import SearchMovie from "./components/SearchMovie";
import "./assets/styles.css"; // Tailwind CSS should be included in your build system
import Recommendation from "./components/Recommendation";
import Player from "./components/Player";
import Host from "./components/Host";
import Feedback from "./components/Feedback";
import Login from "./pages/Login";
import MoviePage from "./pages/Movies";
import Netflix from "./pages/Netflix";
import Signup from "./pages/Signup";
import TVShows from "./pages/TVShows";
import UserListedMovies from "./pages/UserListedMovies";

const HomePage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSwitchToWatchParty = () => {
    setIsLoading(true);

    // Simulate a loading delay
    setTimeout(() => {
      navigate("/watchparty"); // Navigate to the Watch Party page
    }, 3000); // 3 seconds for progress animation
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-black text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6">Welcome to the Watch Party App</h1>
        {!isLoading ? (
          <button
            onClick={handleSwitchToWatchParty}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition duration-300"
          >
            Switch to Watch Party
          </button>
        ) : (
          <div className="progress-container mt-6">
            <p className="text-xl mb-4">Switching to Watch Party Mode...</p>
            <div className="progress-bar bg-gray-700 w-full rounded-lg h-2 max-w-lg mx-auto">
              <div className="progress bg-blue-500 h-full rounded-lg" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route exact path="/" element={<Netflix />} />
        {/* <Route path="/home" element={<HomePage />} /> */}
        <Route path="/watchparty" element={<WatchParty />} />
        <Route exact path="/search" element={<SearchMovie />} />
        <Route exact path="/recommendation" element={<Recommendation />} />
        <Route exact path="/player" element={<Player />} />
        <Route exact path="/host" element={<Host />} />
        <Route exact path="/feedback" element={<Feedback />} />
        <Route exact path="/login" element={<Login />} />
        <Route exact path="/signup" element={<Signup />} />
        <Route exact path="/tv" element={<TVShows />} />
        <Route exact path="/movies" element={<MoviePage />} />
        <Route exact path="/new" element={<Player />} />
        <Route exact path="/mylist" element={<UserListedMovies />} />
      </Routes>
    </Router>
  );
};

export default App;
