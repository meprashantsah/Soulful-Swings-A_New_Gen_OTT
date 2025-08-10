import React, { useState } from 'react';
import '../assets/feedback.css';

const Feedback = () => {
  const [rating, setRating] = useState(0);
  const [suggestions, setSuggestions] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleRating = (rate) => {
    setRating(rate);
  };

  const handleSuggestionsChange = (e) => {
    setSuggestions(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      window.location.href = "/";
    }, 5000);
  };

  return (
    <div className="feedback-form">
      <h1 className="title text-white mt-6">How was your experience with AI Host?</h1>

      <div className="stars text-white">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${rating >= star ? 'filled' : ''}`}
            onClick={() => handleRating(star)}
          >
            ★
          </span>
        ))}
      </div>

      <textarea
        className="suggestions"
        placeholder="Your suggestions..."
        value={suggestions}
        onChange={handleSuggestionsChange}
      />

      <button className="submit-button" onClick={handleSubmit}>Submit</button>

      {submitted && (
        <div className="success-message">
          <span className="checkmark">✔</span>
          <h2 className='text-white'>Your response was submitted successfully!</h2>
        </div>
      )}
    </div>
  );
}

export default Feedback;
