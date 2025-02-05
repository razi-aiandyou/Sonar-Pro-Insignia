import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MessageInput from './MessageInput';
import {saveAs} from 'file-saver';

function ChatWindow({ currentThread, addMessageToThread }) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [citations, setCitations] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [currentThread?.messages, streamedContent]);

  const handleCopy = () => {
    navigator.clipboard.writeText(streamedContent);
    alert('Response copied to clipboard!');
  };

  const handleDownload = async (content, format) => {
    switch (format) {
      case 'txt':
        const txtBlob = new Blob([content], { type: 'text/plain' });
        saveAs(txtBlob, 'response.txt');
        break;
    }
  };

  const parseCitations = (content) => {
    // Split content to remove the "Citations:" section from main content
    const [mainContent] = content.split('Citations:');
    
    // Extract unique citations
    const citationRegex = /\[(\d+)\]\s*(https?:\/\/\S+)/g;
    const citations = new Map(); // Use Map to ensure uniqueness
    
    let match;
    while ((match = citationRegex.exec(content)) !== null) {
      const [_, number, url] = match;
      if (!citations.has(number)) {
        citations.set(number, url);
      }
    }
    
    return {
      cleanContent: mainContent,
      citations: Array.from(citations).map(([number, url]) => ({ number, url }))
    };
  };  

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
    const { cleanContent, citations } = parseCitations(msg.content);
    
    return (
      <div className={`message ${msg.role}-message`}>
        {msg.role === 'user' ? (
          <div className="user-bubble">
            <p>{msg.content}</p>
          </div>
        ) : (
          <>
            <div className="ai-response">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({node, ...props}) => {
                    // Handle citation links
                    if (props.href.startsWith('citation://')) {
                      const citationNumber = props.href.split('://')[1];
                      return (
                        <a
                          {...props}
                          className="citation-link"
                          onClick={(e) => {
                            e.preventDefault();
                            document.querySelector(`#citation-${citationNumber}`)?.scrollIntoView({
                              behavior: 'smooth',
                              block: 'nearest'
                            });
                          }}
                        />
                      );
                    }
                    return <a {...props} target="_blank" rel="noopener noreferrer" />;
                  }
                }}
              >
                {cleanContent.replace(/\[(\d+)\]/g, (match, p1) => `[${p1}](citation://${p1})`)}
              </ReactMarkdown>
              
              {citations.length > 0 && (
                <div className="citation-ticker">
                  <div className="ticker-header">References</div>
                  <div className="ticker-container">
                    {Array.from(new Set(citations)).map((cite, index) => (
                      <div 
                        key={index} 
                        id={`citation-${cite.number}`}
                        className="ticker-item"
                      >
                        <span className="citation-number">[{cite.number}]</span>
                        <a href={cite.url} target="_blank" rel="noopener noreferrer">
                          {cite.url}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="message-actions">
              <button className="action-btn" onClick={() => handleCopy(msg.content)}>
                📋 Copy
              </button>
              <button className="action-btn" onClick={() => handleDownload(msg.content, 'txt')}>
                ⬇️ Download
              </button>
            </div>
          </>
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
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {streamedContent}
                  </ReactMarkdown>
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