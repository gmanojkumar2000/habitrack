import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Settings, Shield, Trash2, Plus, Edit2, Save, X, Key, User as UserIcon, LayoutDashboard, Gift, CheckSquare } from 'lucide-react';
import HabitHistoryDashboard from '../components/HabitHistoryDashboard';
import type { HabitTemplate } from '../types';

function ParentMode() {
  const { 
    settings, users, habitTemplates, dailyEntries, rewardTemplates, adHocEntries,
    addHabitTemplate, updateHabitTemplate, updatePin, updateUser, deleteUser, clearData,
    addRewardTemplate, deleteRewardTemplate, redeemReward, deleteAdHocEntry
  } = useAppContext();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'habits' | 'rewards' | 'settings'>('dashboard');


  
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const targetUser = users.find(u => u.id === selectedUserId) || users.filter(u => u.isActive !== false)[0];

  React.useEffect(() => {
    if (targetUser && !selectedUserId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedUserId(targetUser.id);
    }
  }, [targetUser, selectedUserId]);

  // Settings forms
  const [newPin, setNewPin] = useState('');
  const [profileName, setProfileName] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');

  React.useEffect(() => {
    if (targetUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfileName(targetUser.name);
      setProfileAvatar(targetUser.avatar);
    }
  }, [targetUser]);

  // New habit form state
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitPoints, setNewHabitPoints] = useState(10);
  const [newHabitCategory, setNewHabitCategory] = useState('Responsibility');
  const [newHabitCritical, setNewHabitCritical] = useState(false);
  const [newHabitFrequency, setNewHabitFrequency] = useState<'daily' | 'weekly'>('daily');

  // Edit Habit form state
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPoints, setEditPoints] = useState(10);
  const [editCategory, setEditCategory] = useState('Responsibility');
  const [editCritical, setEditCritical] = useState(false);
  const [editFrequency, setEditFrequency] = useState<'daily' | 'weekly'>('daily');

  // Reward forms
  const [newRewardTitle, setNewRewardTitle] = useState('');
  const [newRewardCost, setNewRewardCost] = useState(100);
  const [rewardSaveStatus, setRewardSaveStatus] = useState<string | null>(null);
  const [newRewardIcon, setNewRewardIcon] = useState('🎁');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === settings.parentPin) {
      setIsAuthenticated(true);
    } else {
      alert('Incorrect PIN');
    }
  };

  const handleUpdatePin = async () => {
    if(newPin.length !== 4) return alert('PIN must be 4 characters');
    await updatePin(newPin);
    alert('PIN Updated!');
    setNewPin('');
  };

  const handleUpdateProfile = async () => {
    if(!profileName.trim() || !targetUser) return;
    await updateUser(targetUser.id, { name: profileName, avatar: profileAvatar });
    alert('Profile updated!');
  };

  const toggleVacationMode = async () => {
    if(!targetUser) return;
    await updateUser(targetUser.id, { vacationMode: !targetUser.vacationMode });
  };

  const handleDeleteProfile = async () => {
    if(!targetUser) return;
    if(window.confirm(`Are you sure you want to lock and delete ${targetUser.name}'s profile? They will no longer be visible.`)) {
      await deleteUser(targetUser.id);
      setSelectedUserId(null); // Reset selection
    }
  };

  // Habit Handlers
  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle || !targetUser) return;
    await addHabitTemplate({
      userId: targetUser.id,
      title: newHabitTitle,
      category: newHabitCategory,
      points: Number(newHabitPoints),
      isActive: true,
      isCritical: newHabitCritical,
      frequency: newHabitFrequency
    });
    setNewHabitTitle('');
    setNewHabitCritical(false);
    setNewHabitFrequency('daily');
  };

  const openEditHabit = (habit: HabitTemplate) => {
    setEditingHabitId(habit.id);
    setEditTitle(habit.title);
    setEditCategory(habit.category);
    setEditPoints(habit.points);
    setEditCritical(!!habit.isCritical);
    setEditFrequency(habit.frequency || 'daily');
  };

  const saveEditHabit = async (id: string) => {
    if (!editTitle) return;
    await updateHabitTemplate(id, {
      title: editTitle,
      category: editCategory,
      points: Number(editPoints),
      isCritical: editCritical,
      frequency: editFrequency
    });
    setEditingHabitId(null);
  };
  
  const disableHabit = async (id: string) => {
    if(window.confirm('Delete this habit?')) {
      await updateHabitTemplate(id, { isActive: false });
    }
  };

  // Reward Handlers
  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newRewardTitle.trim();
    const cost = Number(newRewardCost);

    if (!targetUser) {
      setRewardSaveStatus('Select a child profile before creating a reward.');
      return;
    }

    if (!title) {
      setRewardSaveStatus('Reward title is required.');
      return;
    }

    if (!Number.isFinite(cost) || cost <= 0) {
      setRewardSaveStatus('Reward cost must be greater than 0.');
      return;
    }

    try {
      await addRewardTemplate({
        userId: targetUser.id,
        title,
        cost: Math.round(cost),
        icon: newRewardIcon.trim() || 'Gift',
        isActive: true
      });
      setNewRewardTitle('');
      setNewRewardCost(100);
      setRewardSaveStatus('Reward saved.');
    } catch (error) {
      setRewardSaveStatus(error instanceof Error ? error.message : 'Could not save reward.');
    }
  };

  const handleRedeemReward = async (rewardId: string, cost: number) => {
    if (!targetUser) return;
    // calculate current points to see if they can afford
    const allUserDaily = dailyEntries.filter(e => e.userId === targetUser.id && e.completed);
    const allUserAdHoc = adHocEntries.filter(e => e.userId === targetUser.id);
    const earnedAdHoc = allUserAdHoc.filter(e => e.points > 0);
    const spentAdHoc = allUserAdHoc.filter(e => e.points < 0);
    const lifetimePoints = allUserDaily.reduce((sum, e) => sum + e.pointsSnapshot, 0) + earnedAdHoc.reduce((sum, e) => sum + e.points, 0);
    const currentPoints = lifetimePoints + spentAdHoc.reduce((sum, e) => sum + e.points, 0);

    if (currentPoints < cost) {
      alert("Child doesn't have enough points for this reward.");
      return;
    }

    if (window.confirm("Redeem this reward for the child? This will deduct the points.")) {
      await redeemReward(rewardId, targetUser.id);
      alert("Reward redeemed!");
    }
  };



  const activeHabits = targetUser ? habitTemplates.filter(t => t.userId === targetUser.id && t.isActive) : [];
  const activeRewards = targetUser ? rewardTemplates.filter(t => (t.userId === targetUser.id || t.userId === 'global') && t.isActive) : [];
  const avatars = ['🐯', '🦊', '🐷', '🐸', '🐼', '🦖', '🐉', '🦁', '🐶'];

  const renderHistoryList = (habits: typeof activeHabits, title: string) => {
    if (habits.length === 0) return null;
    return (
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>{title}</h4>
        {habits.map(habit => {
          // Generate last 7 days
          const days = Array.from({length: 7}).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
          });
          
          return (
            <div key={habit.id} style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <strong>{habit.title} {habit.isCritical && <span style={{color: 'var(--warning)', fontSize: '0.8rem'}}>★ Critical</span>}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.25rem' }}>
                {days.map(dateStr => {
                  const entry = dailyEntries.find(e => e.habitTemplateId === habit.id && e.date === dateStr);
                  const isDone = entry?.completed;
                  const hasDemerit = adHocEntries.some(e => e.userId === targetUser?.id && e.relatedHabitId === habit.id && e.date === dateStr && e.category === 'Demerit');

                  const d = new Date(dateStr);
                  const localDate = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
                  const dayLabel = localDate.toLocaleDateString('en-US', {weekday: 'short'}).slice(0,2);
                  const dateNum = localDate.getDate();

                  let bgColor = 'rgba(0, 0, 0, 0.06)';
                  let contentColor = 'var(--text-muted)';
                  let content = <span style={{ opacity: 0.5 }}>−</span>;

                  if (isDone) {
                    bgColor = 'var(--success)';
                    contentColor = 'white';
                    content = <span>✓</span>;
                  } else if (hasDemerit) {
                    bgColor = '#ef4444';
                    contentColor = 'white';
                    content = <span>−</span>;
                  }

                  return (
                    <div key={dateStr} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '50%',
                        background: bgColor,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: contentColor, fontSize: '10px',
                        border: hasDemerit ? 'none' : isDone ? 'none' : '1px solid rgba(0,0,0,0.1)'
                      }}>
                        {content}
                      </div>
                      <span style={{ fontSize: '10px', marginTop: '4px', color: 'var(--text-muted)', lineHeight: '1' }}>{dayLabel}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1' }}>{dateNum}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        })}
      </div>
    );
  };

  void renderHistoryList;

  if (!isAuthenticated) {
    return (
      <div className="container animate-slide-up" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <Shield size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '1.5rem' }}>Parent Area</h2>
          <p style={{ marginBottom: '2rem' }}>Enter the Parent PIN to manage child profiles.</p>
          
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              className="input-field" 
              style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.5rem', marginBottom: '1rem', width: '100%' }}
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="****"
              maxLength={4}
              autoFocus
            />
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Unlock</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-slide-up" style={{ paddingBottom: '100px' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', marginTop: '1rem' }}>
        <Settings size={28} color="var(--primary)" />
        <h2>Parent Control</h2>
      </header>

      {users.length > 0 && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontWeight: 'bold' }}>Managing:</label>
          <select 
            className="input-field" 
            value={targetUser?.id || ''} 
            onChange={e => setSelectedUserId(e.target.value)}
            style={{ width: 'auto', minWidth: '150px' }}
          >
            {users.filter(u => u.isActive !== false).map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <button className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('dashboard')} style={{flex: '0 0 auto', padding: '0.5rem 1rem'}}>
          <LayoutDashboard size={16}/> Dashboard
        </button>
        <button className={`btn ${activeTab === 'habits' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('habits')} style={{flex: '0 0 auto', padding: '0.5rem 1rem'}}>
          <CheckSquare size={16}/> Habits
        </button>
        <button className={`btn ${activeTab === 'rewards' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('rewards')} style={{flex: '0 0 auto', padding: '0.5rem 1rem'}}>
          <Gift size={16}/> Rewards
        </button>
        <button className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('settings')} style={{flex: '0 0 auto', padding: '0.5rem 1rem'}}>
          <Settings size={16}/> Settings
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="animate-fade-in">
          <h3 style={{ marginBottom: '1rem' }}>Habit History</h3>
          <div className="glass-panel" style={{ padding: '1rem' }}>
            {targetUser ? (
              <HabitHistoryDashboard
                userId={targetUser.id}
                habits={activeHabits}
                dailyEntries={dailyEntries}
                adHocEntries={adHocEntries}
              />
            ) : <p>No child profile selected.</p>}
          </div>

          <h3 style={{ marginBottom: '1rem', marginTop: '2rem', color: '#ef4444' }}>Recent Penalties</h3>
          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(() => {
              const recentDemerits = adHocEntries
                .filter(e => e.userId === targetUser?.id && e.points < 0 && e.category === 'Demerit')
                .sort((a, b) => b.createdAt - a.createdAt)
                .slice(0, 5);

              if (recentDemerits.length === 0) return <p>No recent penalties.</p>;

              return recentDemerits.map(d => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--card-bg)', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{d.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{d.date} | {d.points} pts</div>
                  </div>
                  <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }} onClick={async () => {
                    const reason = window.prompt("Reason for reverting this penalty?");
                    if (reason !== null) {
                      await deleteAdHocEntry(d.id);
                    }
                  }}>
                    Revert
                  </button>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {activeTab === 'habits' && (
        <div className="animate-fade-in">
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Manage Daily Habits</h3>
          {activeHabits.length === 0 ? (
            <p style={{ marginBottom: '1rem' }}>No habits assigned yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              {activeHabits.map(habit => (
                <div key={habit.id} className="glass-panel" style={{ padding: '1rem' }}>
                  {editingHabitId === habit.id ? (
                    <div>
                      <div className="input-group">
                        <input className="input-field" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <select className="input-field" style={{flex: 2}} value={editCategory} onChange={e => setEditCategory(e.target.value)}>
                          <option value="Responsibility">Responsibility</option>
                          <option value="Manners">Manners</option>
                          <option value="Health">Health</option>
                        </select>
                        <select className="input-field" style={{flex: 1}} value={editFrequency} onChange={e => setEditFrequency(e.target.value as 'daily'|'weekly')}>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                        </select>
                        <input type="number" className="input-field" style={{flex: 1}} value={editPoints} onChange={e => setEditPoints(Number(e.target.value))} />
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', fontSize: '0.9rem' }}>
                        <input type="checkbox" checked={editCritical} onChange={e => setEditCritical(e.target.checked)} />
                        Critical Habit (Penalties if missed 3+ days)
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <button className="btn btn-primary" style={{flex: 1, padding: '0.5rem'}} onClick={() => saveEditHabit(habit.id)}><Save size={16}/> Save</button>
                        <button className="btn btn-outline" style={{padding: '0.5rem'}} onClick={() => setEditingHabitId(null)}><X size={16}/></button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <strong style={{ display: 'block' }}>{habit.title}</strong>
                        <span className="points-badge" style={{ marginTop: '0.5rem' }}>{habit.points} pts • {habit.category} • {habit.frequency === 'weekly' ? 'Weekly' : 'Daily'} {habit.isCritical && '• Critical'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-outline" style={{ padding: '0.5rem', border: 'none' }} onClick={() => openEditHabit(habit)}>
                          <Edit2 size={18} color="var(--primary)" />
                        </button>
                        <button className="btn btn-outline" style={{ padding: '0.5rem', border: 'none' }} onClick={() => disableHabit(habit.id)}>
                          <Trash2 size={18} color="var(--text-muted)" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <h3 style={{ marginBottom: '1rem' }}>Assign New Habit</h3>
          <div className="glass-panel" style={{ marginBottom: '2rem' }}>
            <form onSubmit={handleCreateHabit}>
              <div className="input-group">
                <label>Title</label>
                <input className="input-field" value={newHabitTitle} onChange={e => setNewHabitTitle(e.target.value)} placeholder="e.g. Brush teeth" />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Category</label>
                  <select className="input-field" value={newHabitCategory} onChange={e => setNewHabitCategory(e.target.value)}>
                    <option value="Responsibility">Responsibility</option>
                    <option value="Manners">Manners</option>
                    <option value="Health">Health</option>
                  </select>
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Frequency</label>
                  <select className="input-field" value={newHabitFrequency} onChange={e => setNewHabitFrequency(e.target.value as 'daily'|'weekly')}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Points</label>
                  <input type="number" className="input-field" value={newHabitPoints} onChange={e => setNewHabitPoints(Number(e.target.value))} />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>
                <input type="checkbox" checked={newHabitCritical} onChange={e => setNewHabitCritical(e.target.checked)} />
                Critical Habit (Penalties if missed 3+ days)
              </label>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <Plus size={20} /> Add Habit
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'rewards' && (
        <div className="animate-fade-in">
          <h3 style={{ marginBottom: '1rem' }}>Custom Rewards</h3>
          {activeRewards.length === 0 ? (
            <p style={{ marginBottom: '1rem' }}>No rewards created.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              {activeRewards.map(reward => (
                <div key={reward.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ fontSize: '1.5rem', background: 'var(--bg-color)', padding: '0.5rem', borderRadius: '12px' }}>{reward.icon}</div>
                    <div>
                      <strong style={{ display: 'block' }}>{reward.title}</strong>
                      <span className="points-badge" style={{ marginTop: '0.25rem' }}>{reward.cost} pts</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }} onClick={() => handleRedeemReward(reward.id, reward.cost)}>
                      Redeem
                    </button>
                    <button className="btn btn-outline" style={{ padding: '0.5rem', border: 'none' }} onClick={() => {
                      if(window.confirm('Delete this reward?')) deleteRewardTemplate(reward.id);
                    }}>
                      <Trash2 size={18} color="var(--text-muted)" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h3 style={{ marginBottom: '1rem' }}>Create Reward</h3>
          <div className="glass-panel" style={{ marginBottom: '2rem' }}>
            <form onSubmit={handleCreateReward}>
              <div className="input-group">
                <label>Title</label>
                <input className="input-field" value={newRewardTitle} onChange={e => setNewRewardTitle(e.target.value)} placeholder="e.g. Disney Trip" />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="input-group" style={{ flex: 2 }}>
                  <label>Cost (Points)</label>
                  <input type="number" className="input-field" value={newRewardCost} onChange={e => setNewRewardCost(Number(e.target.value))} />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Emoji</label>
                  <input className="input-field" value={newRewardIcon} onChange={e => setNewRewardIcon(e.target.value)} placeholder="🎡" />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                <Plus size={20} /> Create Reward
              </button>
              {rewardSaveStatus && (
                <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: rewardSaveStatus === 'Reward saved.' ? 'var(--success)' : '#ef4444' }}>
                  {rewardSaveStatus}
                </p>
              )}
            </form>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="animate-fade-in">
          {/* Profile Editing */}
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><UserIcon size={20}/> Edit Profile</h3>
          <div className="glass-panel" style={{ marginBottom: '2rem' }}>
            <div className="input-group">
              <label>Child's Name</label>
              <input className="input-field" value={profileName} onChange={e => setProfileName(e.target.value)} />
            </div>
            <div className="input-group" style={{marginTop: '1rem', marginBottom: '1rem'}}>
              <label>Avatar Emoji</label>
              <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {avatars.map(a => (
                  <div 
                    key={a}
                    onClick={() => setProfileAvatar(a)}
                    style={{ 
                      fontSize: '2rem', padding: '0.5rem', border: `3px solid ${profileAvatar === a ? 'var(--primary)' : 'transparent'}`,
                      borderRadius: '16px', cursor: 'pointer' 
                    }}
                  >{a}</div>
                ))}
              </div>
            </div>
            
            <div style={{ padding: '1rem', background: 'var(--card-bg)', borderRadius: '12px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ display: 'block' }}>Vacation Mode</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pause demerits and penalties</span>
              </div>
              <button 
                className={`btn ${targetUser?.vacationMode ? 'btn-primary' : 'btn-outline'}`} 
                onClick={toggleVacationMode}
                style={{ padding: '0.5rem 1rem' }}
                disabled={!targetUser}
              >
                {targetUser?.vacationMode ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleUpdateProfile}>Update Profile</button>
              <button className="btn btn-outline" style={{ borderColor: 'var(--secondary)', color: 'var(--secondary)' }} onClick={handleDeleteProfile}><Trash2 size={16}/> Hide Profile</button>
            </div>
          </div>

          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Key size={20}/> Security</h3>
          <div className="glass-panel" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div className="input-group" style={{ flex: 1, margin: 0 }}>
              <label>Update Parent PIN</label>
              <input className="input-field" type="password" placeholder="New PIN" value={newPin} onChange={e => setNewPin(e.target.value)} maxLength={4}/>
            </div>
            <button className="btn btn-outline" onClick={handleUpdatePin}>Change</button>
          </div>



          <h3 style={{ color: '#ef4444', marginBottom: '1rem' }}>Danger Zone</h3>
          <button className="btn btn-outline" style={{ borderColor: '#ef4444', color: '#ef4444', width: '100%' }} onClick={() => {
            if(window.confirm("Are you sure? This will permanently wipe all users and habits!")) {
              clearData();
              window.location.href = '/';
            }
          }}>
            Factory Reset App Data
          </button>
        </div>
      )}
    </div>
  );
}

export default ParentMode;
