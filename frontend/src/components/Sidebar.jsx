import React, { useState } from 'react';

function Sidebar({ threads, currentThreadId, setCurrentThreadId, createNewThread, renameThread, deleteThread }) {
  const [editingThreadId, setEditingThreadId] = useState(null);
  const [newThreadName, setNewThreadName] = useState('');
  const [menuOpenThreadId, setMenuOpenThreadId] = useState(null);

  const handleRename = (threadId) => {
    if (newThreadName.trim()) {
      renameThread(threadId, newThreadName.trim());
      setEditingThreadId(null);
      setNewThreadName('');
    }
  };

  const handleMenuToggle = (e, threadId) => {
    e.stopPropagation();
    setMenuOpenThreadId(menuOpenThreadId === threadId ? null : threadId);
  };

  const handleDelete = (e, threadId) => {
    e.stopPropagation();
    deleteThread(threadId);
    setMenuOpenThreadId(null);
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
                className="menu-icon" 
                onClick={(e) => handleMenuToggle(e, thread.id)}
              >
                ⋮
              </span>
              {menuOpenThreadId === thread.id && (
                <div className="thread-menu">
                  <button onClick={(e) => {
                    e.stopPropagation();
                    setEditingThreadId(thread.id);
                    setNewThreadName(thread.name);
                    setMenuOpenThreadId(null);
                  }}>Rename</button>
                  <button onClick={(e) => handleDelete(e, thread.id)}>Delete</button>
                </div>
              )}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default Sidebar;