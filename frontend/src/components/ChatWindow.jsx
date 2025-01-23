import React, { useState, useRef, useEffect } from 'react';
import MessageInput from './MessageInput';

const formatContent = (content, citations) => {
  const lines = content.split('\n');
  return lines.map((line, lineIndex) => {
    // Handle headers
    if (line.startsWith('# ')) {
      return <h1 key={lineIndex}>{line.slice(2)}</h1>;
    }
    if (line.startsWith('## ')) {
      return <h2 key={lineIndex}>{line.slice(3)}</h2>;
    }
    if (line.startsWith('### ')) {
      return <h3 key={lineIndex}>{line.slice(4)}</h3>;
    }

    // Handle bullet points
    if (line.startsWith('- ')) {
      return <li key={lineIndex}>{formatInline(line.slice(2), citations)}</li>;
    }

    // Handle numbered lists
    const numberedListMatch = line.match(/^\d+\.\s(.*)/);
    if (numberedListMatch) {
      return <li key={lineIndex}>{formatInline(numberedListMatch[1], citations)}</li>;
    }

    // Regular paragraph
    return <p key={lineIndex}>{formatInline(line, citations)}</p>;
  });
};

const formatInline = (text, citations) => {
  // Handle bold text
  const boldRegex = /\*\*(.*?)\*\*/g;
  const parts = text.split(boldRegex);

  return parts.map((part, index) => {
    if (index % 2 === 1) {
      // This part was inside ** **, so it should be bold
      return <strong key={index}>{part}</strong>;
    }

    // Handle citations
    const citationParts = part.split(/(\[\d+\])/g);
    return citationParts.map((citationPart, citationIndex) => {
      const match = citationPart.match(/\[(\d+)\]/);
      if (match && citations) {
        const citationIndex = parseInt(match[1]) - 1;
        return (
          <a
            key={citationIndex}
            href={citations[citationIndex]}
            target="_blank"
            rel="noopener noreferrer"
            className="citation-link"
          >
            {citationPart}
          </a>
        );
      }
      return citationPart;
    });
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
    setCitations([]);

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
                citations: citations
              });
              break;
            } else {
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullContent += parsed.content;
                  setStreamedContent(fullContent);
                }
                if (parsed.citations) {
                  setCitations(parsed.citations);
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
    const content = msg.content.split('\n');
    let inList = false;
    
    return (
      <div className={`message ${msg.role}-message`}>
        {msg.role === 'user' ? (
          <div className="user-bubble">
            <p>{msg.content}</p>
          </div>
        ) : (
          <div className="ai-response">
            {content.map((line, index) => {
              if (line.startsWith('- ') || line.match(/^\d+\.\s/)) {
                if (!inList) {
                  inList = true;
                  return <ul key={index}>{formatContent(line, msg.citations)}</ul>;
                }
                return formatContent(line, msg.citations);
              } else if (inList) {
                inList = false;
                return <>{formatContent(line, msg.citations)}</>;
              } else {
                return formatContent(line, msg.citations);
              }
            })}
            {msg.citations && msg.citations.length > 0 && (
              <div className="citations">
                <h4>Citations:</h4>
                {msg.citations.map((citation, index) => (
                  <p key={index}>
                    <a href={citation} target="_blank" rel="noopener noreferrer">
                      [{index + 1}] {citation}
                    </a>
                  </p>
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
                  {formatContent(streamedContent, citations)}
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