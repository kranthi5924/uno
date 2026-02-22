import React, { useState } from 'react';
import { useGameStore } from '../store';
import { motion } from 'motion/react';

const AVATARS = ['👤', '🤖', '👾', '🚀', '⚡', '🔥', '💎', '🌈'];

export const Lobby: React.FC = () => {
  const { createRoom, joinRoom, setPlayerInfo, playerName, avatar } = useGameStore();
  const [roomIdInput, setRoomIdInput] = useState('');
  const [name, setName] = useState(playerName);
  const [selectedAvatar, setSelectedAvatar] = useState(avatar);

  const handleCreate = () => {
    if (!name) return;
    setPlayerInfo(name, selectedAvatar);
    createRoom();
  };

  const handleJoin = () => {
    if (!name || !roomIdInput) return;
    setPlayerInfo(name, selectedAvatar);
    joinRoom(roomIdInput.toUpperCase());
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-cyber-card/80 backdrop-blur-xl p-8 rounded-3xl border border-neon-blue/30 shadow-2xl relative overflow-hidden"
      >
        <div className="scanline" />
        
        <h1 className="text-5xl font-black text-center mb-8 tracking-tighter italic neon-text italic">
          NEON-O
        </h1>

        <div className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-widest text-neon-blue mb-2 font-bold">Identity</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ENTER CODENAME"
              className="w-full bg-black/50 border border-neon-blue/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-neon-blue/50 transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-neon-blue mb-2 font-bold">Avatar</label>
            <div className="flex flex-wrap gap-2 justify-center">
              {AVATARS.map(a => (
                <button
                  key={a}
                  onClick={() => setSelectedAvatar(a)}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-all ${
                    selectedAvatar === a ? 'bg-neon-blue border-white text-xl scale-110' : 'bg-black/30 border-neon-blue/30 grayscale opacity-50'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <button
              onClick={handleCreate}
              className="bg-neon-blue text-black font-black py-4 rounded-xl hover:bg-white transition-all active:scale-95 uppercase tracking-tighter"
            >
              Create Unit
            </button>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value)}
                placeholder="ROOM ID"
                className="bg-black/50 border border-neon-pink/50 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-neon-pink/50 transition-all font-mono text-center uppercase"
              />
              <button
                onClick={handleJoin}
                className="bg-neon-pink text-black font-black py-2 rounded-xl hover:bg-white transition-all active:scale-95 uppercase tracking-tighter text-sm"
              >
                Join Unit
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">
            Secure connection established // v1.0.4
          </p>
        </div>
      </motion.div>
    </div>
  );
};
