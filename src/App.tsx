import { useEffect } from 'react';
import { useGameStore } from './store';
import { Lobby } from './components/Lobby';
import { GameBoard } from './components/GameBoard';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const { connect, gameState, error } = useGameStore();

  useEffect(() => {
    connect();
  }, [connect]);

  return (
    <div className="min-h-screen bg-cyber-bg text-white selection:bg-neon-blue selection:text-black">
      <AnimatePresence mode="wait">
        {!gameState ? (
          <motion.div
            key="lobby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Lobby />
          </motion.div>
        ) : (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GameBoard />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] bg-red-500 text-white px-6 py-3 rounded-xl font-bold shadow-2xl border border-white/20 flex items-center gap-3"
          >
            <span className="w-2 h-2 bg-white rounded-full animate-ping" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(0,243,255,0.15),transparent)]" />
      </div>
    </div>
  );
}
