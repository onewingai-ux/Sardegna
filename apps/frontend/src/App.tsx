import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameState, PlayerId, Color, PlayerAction } from '@sardegna/shared';

const socket: Socket = io(import.meta.env.VITE_SERVER_URL || window.location.origin);

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<PlayerId>('');
  const [playerName, setPlayerName] = useState('');
  const [color, setColor] = useState<Color>('red');
  const [gameId, setGameId] = useState('');

  useEffect(() => {
    // Basic session persistence
    const savedId = localStorage.getItem('sardegna-player-id');
    if (savedId) setPlayerId(savedId);
    else {
      const newId = Math.random().toString(36).substring(2, 9);
      localStorage.setItem('sardegna-player-id', newId);
      setPlayerId(newId);
    }

    socket.on('gameStateUpdate', (state: GameState) => {
      setGameState(state);
    });

    socket.on('error', (err: { message: string }) => {
      alert(err.message);
    });

    return () => {
      socket.off('gameStateUpdate');
      socket.off('error');
    };
  }, []);

  const createGame = async () => {
    const res = await fetch('/api/games', { method: 'POST' });
    const data = await res.json();
    setGameId(data.gameId);
  };

  const joinGame = () => {
    if (!gameId || !playerName) return alert('Enter game ID and your name');
    socket.emit('joinGame', { gameId, playerId, playerName, color });
  };

  const startGame = () => {
    if (!gameState) return;
    socket.emit('startGame', { gameId: gameState.id, playerId });
  };

  
  const addBot = () => {
    if (!gameState) return;
    socket.emit('addBot', { gameId: gameState.id });
  };

  const playCard = (cardId: string) => {
    if (!gameState) return;
    const action: PlayerAction = {
      type: 'PLAY_CARD',
      playerId,
      cardId
    };
    socket.emit('playerAction', { gameId: gameState.id, action });
  };

  if (!gameState) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4">
        <h1 className="text-4xl font-bold mb-8 text-blue-900">Sardegna Multiplayer</h1>
        
        <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Your Name</label>
            <input 
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight" 
              value={playerName} 
              onChange={e => setPlayerName(e.target.value)} 
              placeholder="e.g. John Doe"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Color</label>
            <select 
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight"
              value={color} 
              onChange={e => setColor(e.target.value as Color)}
            >
              <option value="red">Red</option>
              <option value="blue">Blue</option>
              <option value="yellow">Yellow</option>
              <option value="green">Green</option>
            </select>
          </div>

          <div className="flex gap-2 mb-6">
            <input 
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight" 
              value={gameId} 
              onChange={e => setGameId(e.target.value)} 
              placeholder="Game ID"
            />
            <button 
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={joinGame}
            >
              Join
            </button>
          </div>

          <div className="border-t pt-4 text-center">
            <p className="mb-2 text-sm text-gray-600">Or start a new game</p>
            <button 
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full"
              onClick={createGame}
            >
              Create Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentPlayer = gameState.players.find(p => p.id === playerId);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header / Score Track */}
      <header className="bg-blue-900 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Game: {gameState.id}</h1>
        <div className="flex gap-4">
          {gameState.players.map(p => (
            <div key={p.id} className="flex flex-col items-center">
              <span className="text-sm">{p.name} ({p.color})</span>
              <span className="font-bold text-lg">{p.score} VP</span>
            </div>
          ))}
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-grow flex p-4 gap-4 overflow-hidden">
        
        {/* Left: Board View Placeholder */}
        <div className="flex-grow bg-blue-100 rounded border border-blue-300 relative p-4 overflow-auto">
          <h2 className="text-2xl font-bold mb-4 text-center">Board View</h2>
          <div className="grid grid-cols-4 gap-4 p-4">
            {Object.values(gameState.provinces).map(province => {
              const bgColors = {
                'wheat': 'bg-yellow-200',
                'wine_olive': 'bg-green-300',
                'thyme_cheese': 'bg-yellow-700 text-white'
              };
              
              return (
                <div key={province.id} className={`p-4 rounded shadow ${bgColors[province.resource]} border-2 border-gray-400 min-h-[120px]`}>
                  <h3 className="font-bold border-b border-gray-400 mb-2">{province.name}</h3>
                  <div className="text-xs mb-1 opacity-70 uppercase tracking-widest">{province.resource.replace('_', ' ')}</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {province.pieces.map((piece: any, idx: number) => {
                      const owner = gameState.players.find(p => p.id === piece.playerId);
                      const colorMap = {
                        red: 'bg-red-500',
                        blue: 'bg-blue-500',
                        yellow: 'bg-yellow-400',
                        green: 'bg-green-500'
                      };
                      return (
                         <div key={idx} title={piece.type} className={`w-4 h-4 rounded-full ${colorMap[owner?.color || 'red']} border border-black shadow-sm`}></div>
                      )
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {gameState.phase === 'lobby' && (
            <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 bg-white p-6 rounded shadow z-10 text-center">
              <h3 className="text-lg font-bold mb-2">Lobby</h3>
              <p className="mb-4">{gameState.players.length}/4 Players Joined</p>
              <div className="flex justify-center gap-2">
                {gameState.players.length < 4 && (
                  <button 
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                    onClick={addBot}
                  >
                    Add Bot
                  </button>
                )}
                {gameState.players.length >= 2 && (
                  <button 
                    className="bg-green-500 text-white px-4 py-2 rounded"
                    onClick={startGame}
                  >
                    Start Game
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Fort Cards & Logs */}
        <div className="w-64 flex flex-col gap-4">
           {/* Fort Cards Row */}
           <div className="bg-white p-4 rounded shadow border h-48 overflow-y-auto">
             <h3 className="font-bold border-b mb-2 pb-1">Fort Cards</h3>
             <p className="text-sm">Deck: {gameState.fortCardDeck.length}</p>
             <p className="text-sm">Row: {gameState.fortCardRow.length}</p>
             <div className="flex gap-2 overflow-x-auto mt-2 pb-2">
               {gameState.fortCardRow.slice(0, gameState.faceUpFortCards).map((card: any) => (
                 <div key={card.id} className="min-w-[80px] h-24 bg-white border-2 border-orange-400 rounded shadow-md p-1 flex flex-col justify-between text-xs text-center">
                   <div className="font-bold border-b pb-1 mb-1">{card.id.toUpperCase()}</div>
                   <div className="text-[10px] text-gray-600">Scores:</div>
                   <div className="font-bold text-gray-800">{card.scoringProvinceIds.map((pid: string) => pid.replace('p', 'P')).join(', ')}</div>
                 </div>
               ))}
               {gameState.fortCardRow.slice(gameState.faceUpFortCards).map((_card: any, idx: number) => (
                 <div key={idx} className="min-w-[80px] h-24 bg-blue-800 border-2 border-blue-900 rounded shadow-md p-2 flex items-center justify-center text-blue-200 opacity-80">
                   Back
                 </div>
               ))}
             </div>
           </div>

           {/* Action Log */}
           <div className="bg-white p-4 rounded shadow border flex-grow overflow-y-auto">
             <h3 className="font-bold border-b mb-2 pb-1">Log</h3>
             <ul className="text-sm text-gray-700">
               {[...gameState.log].reverse().map((entry, idx) => (
                 <li key={idx} className="mb-1">{entry}</li>
               ))}
             </ul>
           </div>
        </div>

      </main>

      {/* Footer / Player Hand */}
      <footer className="bg-gray-200 p-4 border-t h-48 flex flex-col justify-center items-center">
        {gameState.activePlayerId === playerId ? (
          <div className="text-green-600 font-bold mb-2">It's your turn!</div>
        ) : (
          <div className="text-gray-500 mb-2">Waiting for other players...</div>
        )}
        
        {currentPlayer && (
          <div className="flex gap-2 overflow-x-auto w-full max-w-4xl px-4">
            {currentPlayer.availableCards.map(card => (
              <button
                key={card.id}
                disabled={gameState.activePlayerId !== playerId || gameState.phase !== 'playing'}
                onClick={() => playCard(card.id)}
                className="flex-shrink-0 w-32 h-40 bg-white border-2 border-gray-400 rounded-lg shadow hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col p-2"
              >
                <div className="font-bold text-sm text-center border-b pb-1 mb-1">{card.name}</div>
                <div className="text-xs text-gray-600 flex-grow">{card.effectDescription}</div>
                <div className="text-xs font-mono text-gray-400 text-right">{card.effectType}</div>
              </button>
            ))}
          </div>
        )}
      </footer>
    </div>
  );
}

export default App;
