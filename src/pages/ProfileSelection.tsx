import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Settings } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { defaultAvatar, profileAvatars } from '../utils/avatars';

function ProfileSelection() {
  const { users, addUser, switchUser } = useAppContext();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(defaultAvatar);

  const handleSelectUser = (id: string) => {
    switchUser(id);
    navigate('/loading');
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await addUser(newName, selectedAvatar, 'primary');
    setIsAdding(false);
    setNewName('');
  };

  if (users.length === 0 || isAdding) {
    return (
      <div className="container animate-slide-up">
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '2rem' }}>
          {users.length === 0 ? "Welcome to Habitrack! Let's add your first hero." : 'Add a new hero'}
        </h2>
        <div className="glass-panel">
          <form onSubmit={handleAddUser}>
            <div className="input-group">
              <label>Hero Name</label>
              <input
                className="input-field"
                type="text"
                placeholder="e.g. Leo"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="input-group" style={{ marginTop: '1rem' }}>
              <label>Pick an Avatar</label>
              <div className="avatar-grid">
                {profileAvatars.slice(0, 6).map(a => (
                  <div
                    key={a}
                    className={`avatar-option ${a === selectedAvatar ? 'selected' : ''}`}
                    onClick={() => setSelectedAvatar(a)}
                  >
                    {a}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              {users.length > 0 && (
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsAdding(false)}>
                  Cancel
                </button>
              )}
              <button type="submit" className="btn btn-primary animate-pop" style={{ flex: 2 }}>
                Ready to Go!
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-slide-up" style={{ justifyContent: 'center' }}>
      <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
        <button
          className="btn btn-outline"
          onClick={() => navigate('/parent')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
        >
          <Settings size={18} />
          Parent Area
        </button>
      </div>
      <h1 style={{ textAlign: 'center', marginBottom: '3rem' }}>Who's playing today?</h1>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center' }}>
        {users.filter(u => u.isActive !== false).map((u, i) => (
          <div
            key={u.id}
            onClick={() => handleSelectUser(u.id)}
            className="glass-panel animate-pop"
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              cursor: 'pointer', padding: '2rem', width: '160px',
              animationDelay: `${i * 0.1}s`
            }}
          >
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{u.avatar}</div>
            <h3 style={{ margin: 0 }}>{u.name}</h3>
          </div>
        ))}

        <div
          onClick={() => setIsAdding(true)}
          className="glass-panel"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', padding: '2rem', width: '160px', opacity: 0.7, borderStyle: 'dashed', borderWidth: '2px'
          }}
        >
          <Plus size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ margin: 0, color: 'var(--text-muted)' }}>Add New</h3>
        </div>
      </div>
    </div>
  );
}

export default ProfileSelection;
