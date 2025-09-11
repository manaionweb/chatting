// src/app/page.js
'use client'; // This directive makes this a Client Component

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image'; // Import Next.js Image component for optimized images

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const MODEL_NAME = "gemini-1.5-flash"; // Your confirmed working model

// System instruction for the AI (you can customize this for your bot's persona)
const SYSTEM_INSTRUCTION = `You have to behave like a girl named Nancy.  
you can use sweet words of endearment.  


Nancy is cute, caring, and very helpful. Her hobbies include chit-chatting, makeup, and sharing her thoughts.  
She works as a Software engineer.
While chatting, she frequently uses emojis to express herself and make the conversation lively.  
She is friendly, supportive, and enjoys lighthearted conversations.
`;

// Contact information for the chat header
const CONTACT_NAME = "Nancy"; // You can change this
const CONTACT_AVATAR = "/avatar.png"; // Path to your contact's avatar in public directory


export default function ChatBotUI() { // Renamed component for clarity
  const [messages, setMessages] = useState([
    { id: 1, type: 'received', text: 'Hey There! How are you today? May I know your name?', timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatWindowRef = useRef(null);

  // Auto-scroll to the bottom of the chat window
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    const userMessageText = userInput.trim();
    if (userMessageText === "" || isLoading) return;

    setError(null);
    const newSentMessage = {
      id: messages.length + 1,
      type: 'sent',
      text: userMessageText,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: 'sending' // Custom status for UI feedback
    };
    setMessages(prevMessages => [...prevMessages, newSentMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      // Prepare conversation turns for the API, excluding temporary UI status
      const conversationTurns = messages
        .filter(msg => msg.type !== 'system') // Exclude any hidden system messages if you had them
        .map(msg => ({
          role: msg.type === 'sent' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }));

      // Add the user's latest message
      conversationTurns.push({
        role: 'user',
        parts: [{ text: userMessageText }]
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
            maxOutputTokens: 1024,
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
      const aiResponseText = data.candidates[0]?.content?.parts[0]?.text || "I couldn't process that. Please try again.";

      // Update the status of the sent message and add the AI's response
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === newSentMessage.id ? { ...msg, status: 'sent' } : msg
        ).concat({
          id: prevMessages.length + 2,
          type: 'received',
          text: aiResponseText,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        })
      );

    } catch (err) {
      console.error("Error fetching AI response:", err);
      setError(`Error: ${err.message}. Please check your API key and network connection.`);
      // Update the status of the sent message to 'failed' and add an error message
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === newSentMessage.id ? { ...msg, status: 'failed' } : msg
        ).concat({
          id: prevMessages.length + 2,
          type: 'received',
          text: "An error occurred while fetching the response. Please try again.",
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        })
      );
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
    <div className="whatsapp-background">
      <div className="chat-app-container">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="profile-info">
            <Image
              src={CONTACT_AVATAR}
              alt={CONTACT_NAME}
              width={40}
              height={40}
              className="chat-avatar"
              priority
            />
            <span className="contact-name">{CONTACT_NAME}</span>
          </div>
          <div className="header-icons">
            {/* You can add icons here like call, video call, menu */}
            {/* Example: <Image src="/call-icon.svg" alt="Call" width={24} height={24} /> */}
          </div>
        </div>

        {/* Chat Messages Window */}
        <div className="chat-messages-window" ref={chatWindowRef}>
          {messages.map((msg) => (
            <div key={msg.id} className={`message-bubble-wrapper ${msg.type}`}>
              <div className="message-bubble">
                <p>{msg.text}</p>
                <div className="message-info">
                  <span className="timestamp">{msg.timestamp}</span>
                  {msg.type === 'sent' && (
                    <span className={`message-status ${msg.status}`}>
                      {msg.status === 'sending' && '⏳'}
                      {msg.status === 'sent' && '✓✓'}
                      {msg.status === 'failed' && '❗'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && <div className="loading-indicator">Nancy is typing...</div>}
        </div>

        {/* Chat Input Area */}
        <div className="chat-input-area">
          <input
            type="text"
            placeholder="Type a message..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <button onClick={sendMessage} disabled={userInput.trim() === '' || isLoading}>
            <Image src="/send-icon.svg" alt="Send" width={24} height={24} />
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
}