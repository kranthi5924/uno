import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store';
import { Card } from './Card';
import { motion, AnimatePresence } from 'motion/react';
import { CardColor } from '../types';
import { Volume2, VolumeX, LogOut, Plus, Play, UserPlus } from 'lucide-react';

export const GameBoard: React.FC = () => {
  const { gameState, socket, playCard, drawCard, callUno, startGame, addAI } = useGameStore();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingWildCardId, setPendingWildCardId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  if (!gameState) return null;

  const me = gameState.players.find(p => p.id === socket?.id);
  const isMyTurn = gameState.status === 'playing' && gameState.players[gameState.currentPlayerIndex].id === socket?.id;
  const topCard = gameState.discardPile[gameState.discardPile.length - 1];

  const handleCardClick = (cardId: string) => {
    if (!isMyTurn) return;
    const card = me?.hand.find(c => c.id === cardId);
    if (!card) return;

    if (card.color === 'wild') {
      setPendingWildCardId(cardId);
      setShowColorPicker(true);
    } else {
      playCard(cardId);
    }
  };

  const handleColorSelect = (color: CardColor) => {
    if (pendingWildCardId) {
      playCard(pendingWildCardId, color);
      setPendingWildCardId(null);
      setShowColorPicker(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden relative">
      <div className="scanline" />

      {/* Header */}
      <div className="p-4 flex justify-between items-center z-20 bg-black/20 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black tracking-tighter neon-text italic">NEON-O</h2>
          <div className="px-3 py-1 bg-neon-blue/20 border border-neon-blue/50 rounded-full text-[10px] font-mono text-neon-blue uppercase tracking-widest">
            Room: {gameState.roomId}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 text-white/50 hover:text-white transition-colors">
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <button className="p-2 text-white/50 hover:text-red-500 transition-colors" onClick={() => window.location.reload()}>
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 relative flex items-center justify-center">
        {/* Opponents */}
        <div className="absolute top-8 left-0 right-0 flex justify-center gap-8 px-4">
          {gameState.players.map((p, idx) => {
            if (p.id === socket?.id) return null;
            const isTurn = gameState.currentPlayerIndex === idx;
            return (
              <motion.div 
                key={p.id}
                animate={isTurn ? { scale: 1.1 } : { scale: 1 }}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                  isTurn ? 'bg-neon-blue/20 border-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.3)]' : 'bg-black/40 border-white/10'
                }`}
              >
                <div className="text-2xl">{p.avatar}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest max-w-[80px] truncate">{p.name}</div>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(p.hand.length, 5) }).map((_, i) => (
                    <div key={i} className="w-2 h-3 bg-neon-blue/50 rounded-sm border border-neon-blue/30" />
                  ))}
                  {p.hand.length > 5 && <span className="text-[8px] font-mono">+{p.hand.length - 5}</span>}
                </div>
                {p.hasCalledUno && (
                  <div className="absolute -top-2 -right-2 bg-neon-pink text-black text-[8px] font-black px-2 py-0.5 rounded-full animate-bounce">UNO!</div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Center Pile */}
        <div className="flex items-center gap-12 z-10">
          {/* Deck */}
          <motion.div 
            whileHover={isMyTurn ? { scale: 1.05, rotate: -2 } : {}}
            whileTap={isMyTurn ? { scale: 0.95 } : {}}
            onClick={() => isMyTurn && drawCard()}
            className={`w-24 h-36 md:w-32 md:h-48 rounded-xl border-2 border-neon-blue/50 bg-cyber-card flex items-center justify-center cursor-pointer relative group ${
              !isMyTurn && 'opacity-50 grayscale cursor-not-allowed'
            }`}
          >
            <div className="absolute inset-2 border border-neon-blue/20 rounded-lg flex items-center justify-center">
              <span className="text-4xl font-black text-neon-blue/20 group-hover:text-neon-blue/40 transition-colors">N</span>
            </div>
            <div className="text-[10px] font-mono text-neon-blue/50 uppercase tracking-widest absolute bottom-4">Draw</div>
          </motion.div>

          {/* Discard Pile */}
          <div className="relative">
            <AnimatePresence mode="popLayout">
              {topCard && (
                <Card 
                  key={topCard.id}
                  card={{ ...topCard, color: gameState.currentColor }} 
                  disabled 
                  className="shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                />
              )}
            </AnimatePresence>
            <div className="absolute -bottom-8 left-0 right-0 text-center">
              <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${
                gameState.currentColor === 'red' ? 'text-red-500' :
                gameState.currentColor === 'blue' ? 'text-neon-blue' :
                gameState.currentColor === 'green' ? 'text-neon-green' :
                gameState.currentColor === 'yellow' ? 'text-yellow-400' : 'text-white'
              }`}>
                Current: {gameState.currentColor}
              </span>
            </div>
          </div>
        </div>

        {/* Game Status Overlay */}
        {gameState.status === 'waiting' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center">
            <div className="text-center p-8 bg-cyber-card rounded-3xl border border-neon-blue/30 max-w-sm w-full">
              <h3 className="text-2xl font-black mb-6 tracking-tighter uppercase">Waiting for Units</h3>
              <div className="space-y-4">
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                  {gameState.players.map(p => (
                    <div key={p.id} className="w-12 h-12 flex items-center justify-center bg-black/40 rounded-xl border border-white/10 text-xl" title={p.name}>
                      {p.avatar}
                    </div>
                  ))}
                  {Array.from({ length: 4 - gameState.players.length }).map((_, i) => (
                    <div key={i} className="w-12 h-12 flex items-center justify-center bg-black/10 rounded-xl border border-dashed border-white/5 text-white/10">
                      ?
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={addAI}
                    disabled={gameState.players.length >= 10}
                    className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all border border-white/10"
                  >
                    <UserPlus size={18} /> Add Bot
                  </button>
                  <button 
                    onClick={startGame}
                    disabled={gameState.players.length < 2}
                    className="flex items-center justify-center gap-2 bg-neon-green text-black font-black py-4 rounded-xl hover:scale-105 transition-all disabled:opacity-50 disabled:grayscale"
                  >
                    <Play size={20} fill="currentColor" /> Initiate Sequence
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Win Screen */}
        {gameState.status === 'finished' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <div className="text-8xl mb-4">🏆</div>
              <h2 className="text-6xl font-black neon-text italic mb-2 uppercase tracking-tighter">Mission Success</h2>
              <p className="text-xl text-neon-blue font-mono mb-8 uppercase tracking-widest">
                {gameState.players.find(p => p.id === gameState.winner)?.name} Dominates
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-white text-black font-black px-12 py-4 rounded-full hover:bg-neon-blue transition-all uppercase tracking-widest"
              >
                New Mission
              </button>
            </motion.div>
          </div>
        )}
      </div>

      {/* My Hand */}
      <div className="p-8 pb-12 bg-gradient-to-t from-black/80 to-transparent z-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-end mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center bg-neon-blue/20 rounded-xl border border-neon-blue text-2xl">
                {me?.avatar}
              </div>
              <div>
                <div className="text-xs font-mono text-neon-blue uppercase tracking-widest">Active Unit</div>
                <div className="font-black text-xl tracking-tighter uppercase">{me?.name}</div>
              </div>
            </div>

            <div className="flex gap-4">
              {me?.hand.length === 2 && !me.hasCalledUno && (
                <button 
                  onClick={callUno}
                  className="bg-neon-pink text-black font-black px-8 py-2 rounded-xl animate-pulse hover:scale-110 transition-all uppercase tracking-tighter"
                >
                  Call UNO!
                </button>
              )}
              <div className={`px-6 py-2 rounded-xl border font-black uppercase tracking-widest transition-all ${
                isMyTurn ? 'bg-neon-blue text-black border-white' : 'bg-black/40 text-white/30 border-white/5'
              }`}>
                {isMyTurn ? 'Your Turn' : 'Waiting...'}
              </div>
            </div>
          </div>

          <div className="flex justify-center -space-x-8 md:-space-x-12 overflow-x-auto py-4 px-8 no-scrollbar">
            {me?.hand.map((card) => (
              <Card 
                key={card.id} 
                card={card} 
                onClick={() => handleCardClick(card.id)}
                isCurrentTurn={isMyTurn}
                disabled={!isMyTurn}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Color Picker Modal */}
      <AnimatePresence>
        {showColorPicker && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-cyber-card p-8 rounded-3xl border border-white/10 text-center"
            >
              <h3 className="text-xl font-black mb-8 uppercase tracking-widest">Select Protocol Color</h3>
              <div className="grid grid-cols-2 gap-4">
                {(['red', 'blue', 'green', 'yellow'] as CardColor[]).map(color => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    className={`w-24 h-24 rounded-2xl border-2 transition-all hover:scale-110 active:scale-95 ${
                      color === 'red' ? 'bg-red-500/20 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' :
                      color === 'blue' ? 'bg-neon-blue/20 border-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.5)]' :
                      color === 'green' ? 'bg-neon-green/20 border-neon-green shadow-[0_0_15px_rgba(57,255,20,0.5)]' :
                      'bg-yellow-400/20 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Game Log */}
      <div className="absolute bottom-4 left-4 w-64 h-32 overflow-y-auto no-scrollbar pointer-events-none z-10">
        <div className="flex flex-col-reverse gap-1">
          {gameState.messages.slice(-5).map(msg => (
            <div key={msg.id} className="text-[10px] font-mono text-white/40 bg-black/20 px-2 py-1 rounded border-l border-neon-blue/30">
              {msg.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
