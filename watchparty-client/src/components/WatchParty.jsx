import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import "../assets/styles.css"; // Tailwind CSS will be used for styles

const WatchParty = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [answers, setAnswers] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const hasWelcomedRef = useRef(false); // Ref to track if the welcome message has been spoken
  const navigate = useNavigate();
  

  const questions = [
    "Alright, let’s start with the basics. Are you in the mood for a quick movie or a binge-worthy show?",
    "Now, tell me—how are you feeling right now? Your mood sets the tone for the kind of experience you’ll love.",
    "Alright, let’s talk genres. What are you in the mood for? Something thriller, romantic, or maybe a comedy?",
    "Do you have a preference for where the content comes from? Are we talking Hollywood or Bollywood?",
    "One last thing—how much time do you have? Are you up for something epic, or do you need a shorter watch? just tell in minutes"
  ];

  const acknowledgments = [
    "Got it! Let’s find the perfect one for you.",
    "Ah, I see! your feeling. I’ll make sure to match that vibe with just the right pick.",
    "Great choice! it is. Let me keep that in mind as we move forward.",
    "Okay, Got it!",
    "Alright! I’ll make sure the pick fits your schedule."
  ];

  const sendResponsesToApi = async (responses) => {
    try {
      const response = await fetch("http://localhost:5000/api/save-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses }),
      });

      if (!response.ok) {
        throw new Error("Failed to save responses.");
      }

      const data = await response.json();
      console.log(data.message); // Success message
    } catch (error) {
      console.error("Error sending responses:", error);
    }
  };

  const speak = (text, callback) => {
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = window.speechSynthesis.getVoices().find((voice) =>
      voice.name.includes("Male")
    );
    utterance.onend = () => {
      setIsSpeaking(false);
      if (callback) callback();
    };
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
  
    recognition.onstart = () => setIsListening(true);
  
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
  
      setAnswers((prev) => [...prev, transcript]);
      setIsListening(false);
  
      const acknowledgment =
        acknowledgments[
          Math.min(currentQuestionIndex, acknowledgments.length - 1)
        ];
  
      // Speak acknowledgment and decide next action
      speak(acknowledgment, () => {
        if (currentQuestionIndex < questions.length - 1) {
          // Move to the next question with minimal delay
          setCurrentQuestionIndex((prev) => prev + 1);
        } else {
          // Process the final answer and send to the API
          const allResponses = questions.map((question, index) => ({
            question,
            answer: [...answers, transcript][index] || "No response",
          }));
          sendResponsesToApi(allResponses);
          navigate("/recommendation");
        }
      });
    };
  
    recognition.onend = () => setIsListening(false);
  
    recognition.start();
  };
  
  useEffect(() => {
    if (currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) {
      speak(questions[currentQuestionIndex], () => {
        startListening(); // Start listening immediately after question is spoken
      });
    }
  }, [currentQuestionIndex]);
  
  useEffect(() => {
    // Ensure the welcome message is spoken only once
    if (!hasWelcomedRef.current) {
      hasWelcomedRef.current = true; // Mark the welcome message as spoken
      const welcomeScript =
        "Hey there! Welcome to Soulful Swings!. I’m your Host, and I’m here to help you pick something great to watch today. Let’s get to know what kind of mood you’re in, and I’ll find the perfect match for you. Are you Ready?";
        speak(welcomeScript, () => {
        setCurrentQuestionIndex(0);
      });
    }
  }, []);
  


  return (
    <div className="watch-party-container bg-black text-white p-8 min-h-screen">
      <div className="text-center mb-6">
        {/* <h1 className="text-3xl font-bold mb-4">Watch Party Mode</h1> */}
      </div>
      <div className="questions-container mb-6 text-center">
        {currentQuestionIndex >= 0 && currentQuestionIndex < questions.length && (
          <p className="text-lg font-semibold">
            {questions[currentQuestionIndex]}
          </p>
        )}
      </div>

      <div className="answer-container mb-6">
        <div className="flex justify-center items-center h-40 mt-[14rem]">
          {isSpeaking && <img src="speech.gif" alt="Speaking" className="h-90 w-90" />}
        </div>
        <div>
          <p className="text-lg mt-[7rem] ml-[77rem]">
            Listening: <span className="font-bold">{isListening ? "Yes" : "No"}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default WatchParty;