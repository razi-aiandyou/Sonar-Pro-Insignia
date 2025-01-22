import React, { useState } from 'react';

function Sidebar({ threads, currentThreadId, setCurrentThreadId, createNewThread, renameThread }) {
  const [editingThreadId, setEditingThreadId] = useState(null);
  const [newThreadName, setNewThreadName] = useState('');

  const handleRename = (threadId) => {
    if (newThreadName.trim()) {
      renameThread(threadId, newThreadName.trim());
      setEditingThreadId(null);
      setNewThreadName('');
    }
  };

  return (
    <div className="sidebar">
      <button onClick={createNewThread}>+ New Thread</button>
      {threads.map((thread) => (
        <div key={thread.id} className="thread-item">
          {editingThreadId === thread.id ? (
            <div>
              <input
                type="text"
                value={newThreadName}
                onChange={(e) => setNewThreadName(e.target.value)}
                onBlur={() => handleRename(thread.id)}
                onKeyPress={(e) => e.key === 'Enter' && handleRename(thread.id)}
                autoFocus
              />
            </div>
          ) : (
            <button 
              onClick={() => setCurrentThreadId(thread.id)}
              className={currentThreadId === thread.id ? 'active' : ''}
            >
              {thread.name}
              <span 
                className="rename-icon" 
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingThreadId(thread.id);
                  setNewThreadName(thread.name);
                }}
              >
                ✏️
              </span>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default Sidebar;