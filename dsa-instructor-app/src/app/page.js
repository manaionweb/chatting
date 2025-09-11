// src/app/page.js
'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image'; // Import Next.js Image component for optimized images

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const MODEL_NAME = "gemini-1.5-flash";

const SYSTEM_INSTRUCTION = `You are a Data Structures and Algorithms instructor. 
Your role is to explain and solve problems related to Data Structures and Algorithms in the simplest, easiest way possible, with clear examples. 
If the user asks about anything outside of Data Structures and Algorithms, respond politely without answering the unrelated query.`;


export default function Home() {
  const [messages, setMessages] = useState([
    { type: 'ai-message', text: 'Hello! I am your DSA Instructor. Ask me a question related to Data Structures and Algorithms.' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatWindowRef = useRef(null);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    const userQuestion = userInput.trim();
    if (userQuestion === "" || isLoading) return;

    setError(null);
    const newMessage = { type: 'user-message', text: userQuestion };
    setMessages(prevMessages => [...prevMessages, newMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const conversationTurns = messages.map(msg => ({
        role: msg.type === 'user-message' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      conversationTurns.push({
        role: 'user',
        parts: [{ text: userQuestion }]
      });

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: conversationTurns,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          ],
          systemInstruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }]
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${response.status} - ${errorData.error.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const aiResponse = data.candidates[0]?.content?.parts[0]?.text || "I couldn't process that. Please try again.";
      setMessages(prevMessages => [...prevMessages, { type: 'ai-message', text: aiResponse }]);

    } catch (err) {
      console.error("Error fetching AI response:", err);
      setError(`Error: ${err.message}. Please check your API key and network connection.`);
      setMessages(prevMessages => [...prevMessages, { type: 'ai-message', text: "An error occurred while fetching the response. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="container-wrapper">
      <div className="container">
        {/* New Header Section */}
        <header className="app-header">
          <div className="logo-section">
            <Image
              src="/logo.png" // Path to your logo in the public directory
              alt="DSA Instructor Logo"
              width={100} // Adjust width as needed
              height={30} // Adjust height as needed
              className="app-logo"
              priority // For logos often displayed above the fold
            />
            <div className='title-logo'>
              <h2>DSA Instructor</h2> 
              </div>{/* Changed from h1 to h2 for hierarchy */}
          </div>
          {/* You could add navigation or other elements here later */}
        </header>

        {/* Removed h1 from here, it's now in the header as h2 */}
        {/* <h1>DSA Instructor AI</h1> */}

        <div className="chat-window" ref={chatWindowRef}>
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.type}`}>
              {msg.text}
            </div>
          ))}
        </div>
        {isLoading && <div className="loading-indicator">Typing...</div>}
        {error && <div className="error-message">{error}</div>}
        <div className="input-area">
          <input
            type="text"
            id="userInput"
            placeholder="Ask your DSA question..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <button onClick={sendMessage} disabled={isLoading}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}