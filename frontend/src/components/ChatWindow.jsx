import React from 'react';
import MessageInput from './MessageInput';
import { sendMessage } from '../services/api';

function ChatWindow({ currentThread, addMessageToThread }) {
  const handleSendMessage = async (message) => {
    if (!currentThread) return;

    const userMessage = { role: 'user', content: message };
    addMessageToThread(currentThread.id, userMessage);
    
    try {
      const response = await sendMessage(message, currentThread.id);
      const assistantMessage = { 
        role: 'assistant', 
        content: response.output,
        citations: response.citations 
      };
      addMessageToThread(currentThread.id, assistantMessage);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderMessage = (msg) => {
    const formatContent = (content) => {
      // Split content by newlines
      const lines = content.split('\n');
      return lines.map((line, index) => {
        // Check if line is a header
        if (line.startsWith('##')) {
          return <h2 key={index}>{line.replace('##', '').trim()}</h2>;
        }
        // Check if line is a subheader
        if (line.startsWith('**') && line.endsWith('**')) {
          return <h3 key={index}>{line.replace(/\*\*/g, '').trim()}</h3>;
        }
        // Regular paragraph
        return <p key={index}>{line}</p>;
      });
    };

    return (
      <div className={`message ${msg.role}-message`}>
        {msg.role === 'user' ? (
          <p>{msg.content}</p>
        ) : (
          <div className="ai-response">
            {formatContent(msg.content)}
            {msg.citations && (
              <div className="citations">
                <h4>Citations:</h4>
                {msg.citations.map((citation, index) => (
                  <p key={index}>[{index + 1}] {citation}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="chat-window">
      {currentThread ? (
        <>
          <div className="messages">
            {currentThread.messages.map((msg, index) => (
              <div key={index}>{renderMessage(msg)}</div>
            ))}
          </div>
          <MessageInput onSendMessage={handleSendMessage} />
        </>
      ) : (
        <div className="no-thread-selected">
          <p>Select a thread or create a new one to start chatting.</p>
        </div>
      )}
    </div>
  );
}

export default ChatWindow;