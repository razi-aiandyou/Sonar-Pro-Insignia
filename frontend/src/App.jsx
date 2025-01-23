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
    setThreads(prevThreads => 
      prevThreads.map(thread => 
        thread.id === threadId
          ? { ...thread, messages: [...thread.messages, message] }
          : thread
      )
    );
  };

  const deleteThread = (threadId) => {
    setThreads(prevThreads => prevThreads.filter(thread => thread.id !== threadId));
    if (currentThreadId === threadId) {
      setCurrentThreadId(null);
    }
  };  

  const currentThread = threads.find(thread => thread.id === currentThreadId);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Insignia AI Companion</h1>
      </header>
      <div className="main-content">
        <Sidebar 
          threads={threads}
          currentThreadId={currentThreadId}
          setCurrentThreadId={setCurrentThreadId}
          createNewThread={createNewThread}
          renameThread={renameThread}
          deleteThread={deleteThread}
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