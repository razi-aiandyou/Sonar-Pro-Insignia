import React, { useState, useRef, useEffect } from 'react';
import MessageInput from './MessageInput';

const formatContent = (content) => {
  const lines = content.split('\n');
  return lines.map((line, index) => {
    if (line.startsWith('##')) {
      return <h2 key={index}>{line.replace('##', '').trim()}</h2>;
    }
    if (line.startsWith('**') && line.endsWith('**')) {
      return <h3 key={index}>{line.replace(/\*\*/g, '').trim()}</h3>;
    }
    return <p key={index}>{line}</p>;
  });
};

function ChatWindow({ currentThread, addMessageToThread }) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [citations, setCitations] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [currentThread?.messages, streamedContent]);

  const handleSendMessage = async (message) => {
    if (!currentThread) return;
  
    const userMessage = { role: 'user', content: message };
    addMessageToThread(currentThread.id, userMessage);
    
    setIsStreaming(true);
    setStreamedContent('');
  
    try {
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, thread: currentThread.id }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
  
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setIsStreaming(false);
              addMessageToThread(currentThread.id, {
                role: 'assistant',
                content: fullContent,
              });
              break;
            } else {
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullContent += parsed.content;
                  setStreamedContent(fullContent);
                }
              } catch (e) {
                console.error('Error parsing streaming data:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsStreaming(false);
    }
  };
  

  const renderMessage = (msg) => {
    return (
      <div className={`message ${msg.role}-message`}>
        {msg.role === 'user' ? (
          <div className="user-bubble">
            <p>{msg.content}</p>
          </div>
        ) : (
          <div className="ai-response">
            {formatContent(msg.content)}
            {msg.citations && msg.citations.length > 0 && (
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
            {isStreaming && (
              <div className="message assistant-message">
                <div className="ai-response">
                  {formatContent(streamedContent)}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
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