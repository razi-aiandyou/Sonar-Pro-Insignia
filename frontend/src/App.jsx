import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';

function App() {
  const [threads, setThreads] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(null);

  const createNewThread = () => {
    const newThread = { id: Date.now(), name: `New Thread ${threads.length + 1}`, messages: [] };
    setThreads([...threads, newThread]);
    setCurrentThreadId(newThread.id);
  };

  const renameThread = (threadId, newName) => {
    setThreads(threads.map(thread => 
      thread.id === threadId ? { ...thread, name: newName } : thread
    ));
  };

  const addMessageToThread = (threadId, message) => {
    setThreads(threads.map(thread => 
      thread.id === threadId 
        ? { ...thread, messages: [...thread.messages, message] } 
        : thread
    ));
  };

  const currentThread = threads.find(thread => thread.id === currentThreadId);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Insignia Investment Analyst</h1>
      </header>
      <div className="main-content">
        <Sidebar 
          threads={threads}
          currentThreadId={currentThreadId}
          setCurrentThreadId={setCurrentThreadId}
          createNewThread={createNewThread}
          renameThread={renameThread}
        />
        <ChatWindow 
          currentThread={currentThread}
          addMessageToThread={addMessageToThread}
        />
      </div>
    </div>
  );
}

export default App;