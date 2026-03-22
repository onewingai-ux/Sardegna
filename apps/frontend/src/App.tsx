import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameState, PlayerId, Color, PlayerAction } from '@sardegna/shared';
import mapImage from "./assets/map.png";


const PROVINCE_COORDS = {
  p1: { x: 278, y: 148, token_x: 281, token_y: 181 },
  p2: { x: 381, y: 149, token_x: 405, token_y: 209 },
  p3: { x: 427, y: 89, token_x: 470, token_y: 115 },
  p4: { x: 290, y: 235, token_x: 325, token_y: 266 },
  p5: { x: 473, y: 164, token_x: 492, token_y: 195 },
  p6: { x: 357, y: 313, token_x: 342, token_y: 349 },
  p7: { x: 450, y: 267, token_x: 489, token_y: 290 },
  p8: { x: 574, y: 224, token_x: 604, token_y: 266 },
  p9: { x: 375, y: 389, token_x: 397, token_y: 433 },
  p10: { x: 456, y: 375, token_x: 543, token_y: 371 },
  p11: { x: 330, y: 528, token_x: 353, token_y: 553 },
  p12: { x: 441, y: 477, token_x: 460, token_y: 554 },
  p13: { x: 517, y: 462, token_x: 564, token_y: 492 },
  p14: { x: 267, y: 588, token_x: 294, token_y: 651 },
  p15: { x: 381, y: 606, token_x: 391, token_y: 641 },
  p16: { x: 501, y: 603, token_x: 546, token_y: 641 },
};



const HARBOR_COORDS = {
  h1: { x: 277, y: 106 },
  h2: { x: 621, y: 111 },
  h3: { x: 205, y: 255 },
  h4: { x: 621, y: 371 },
  h5: { x: 206, y: 441 },
};

const FORT_COORDS = {
  f1: { x: 317, y: 113 },
  f2: { x: 380, y: 95 },
  f3: { x: 421, y: 153 },
  f4: { x: 543, y: 61 },
  f5: { x: 218, y: 222 },
  f6: { x: 327, y: 194 },
  f7: { x: 388, y: 251 },
  f8: { x: 460, y: 219 },
  f9: { x: 527, y: 216 },
  f10: { x: 600, y: 176 },
  f11: { x: 254, y: 305 },
  f12: { x: 409, y: 338 },
  f13: { x: 521, y: 301 },
  f14: { x: 588, y: 325 },
  f15: { x: 230, y: 393 },
  f16: { x: 478, y: 431 },
  f17: { x: 604, y: 399 },
  f18: { x: 262, y: 476 },
  f19: { x: 398, y: 460 },
  f20: { x: 516, y: 519 },
  f21: { x: 576, y: 559 },
  f22: { x: 218, y: 551 },
  f23: { x: 304, y: 611 },
  f24: { x: 395, y: 560 },
  f25: { x: 446, y: 643 },
  f26: { x: 276, y: 718 },
};

const socket: Socket = io(import.meta.env.VITE_SERVER_URL || window.location.origin);


function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<PlayerId>('');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
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

  const playCard = (card: any) => {
    if (!gameState) return;
    
    // If it's the Sentinel card, it doesn't need a target, just play it
    if (card.effectType === 'sentinel') {
      const action: PlayerAction = {
        type: 'PLAY_CARD',
        playerId,
        cardId: card.id
      };
      socket.emit('playerAction', { gameId: gameState.id, action });
      setSelectedCardId(null);
      return;
    }
    
    // Otherwise, we wait for the user to click a target on the map
    if (selectedCardId === card.id) {
       setSelectedCardId(null); // toggle off
    } else {
       setSelectedCardId(card.id);
    }
  };

  const handleSentinelReveal = (keep: boolean) => {
    if (!gameState) return;
    const action: PlayerAction = {
      type: 'SENTINEL_REVEAL',
      playerId,
      payload: { keep }
    };
    socket.emit('playerAction', { gameId: gameState.id, action });
  };

  const handleMapClick = (targetId: string, type: 'province' | 'fortSpace' | 'harbor') => {
    if (!gameState || !selectedCardId) return;

    // We have a pending card to play, and the user just clicked a map target
    const action: PlayerAction = {
      type: 'PLAY_CARD',
      playerId,
      cardId: selectedCardId,
      payload: { targetId, targetType: type }
    };
    
    socket.emit('playerAction', { gameId: gameState.id, action });
    setSelectedCardId(null); // reset UI state after sending
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
        <div className="flex-grow bg-blue-100 rounded border border-blue-300 relative p-4 overflow-auto min-w-[800px] min-h-[800px]">
          <h2 className="text-2xl font-bold mb-4 absolute top-4 left-4 z-10">Board View (Island of Sardegna)</h2>
          
          
          {/* We now lock the SVG to the same aspect ratio container. The map image is rendered INSIDE the SVG to guarantee the coordinate system perfectly matches the pixels of the calibration. */}
          <svg className="w-full h-full max-h-[800px] mx-auto absolute top-0 left-0 right-0" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid meet">
            <image href={mapImage} x="0" y="0" width="800" height="800" preserveAspectRatio="xMidYMid meet" opacity="0.8" />
                                    {/* Draw harbors */}
            {Object.values(gameState.harbors || {}).map((harbor) => {
              const p = HARBOR_COORDS[harbor.id as keyof typeof HARBOR_COORDS];
              if (!p) return null;
              
              return (
                <g key={harbor.id} transform={`translate(${p.x}, ${p.y})`} onClick={() => handleMapClick(harbor.id, 'harbor')} style={{cursor: selectedCardId ? 'crosshair' : 'default'}}>
                  <circle cx="0" cy="0" r="20" fill="transparent" />
                  
                  {/* Any placed ships */}
                  {harbor.ships?.map((piece: any, idx: number) => {
                    const owner = gameState.players.find(pl => pl.id === piece.playerId);
                    const colorMap: Record<string, string> = { red: '#ef4444', blue: '#3b82f6', yellow: '#facc15', green: '#22c55e' };
                    const fill = colorMap[owner?.color || 'red'];
                    return (
                      <ellipse key={idx} cx={-8 + (idx * 16)} cy="0" rx="8" ry="4" fill={fill} stroke="white" strokeWidth="1" />
                    );
                  })}
                </g>
              );
            })}

            {/* Draw forts */}
            {Object.values(gameState.fortSpaces || {}).map((fortSpace) => {
              const p = FORT_COORDS[fortSpace.id as keyof typeof FORT_COORDS];
              if (!p) return null;
              
              return (
                <g key={fortSpace.id} transform={`translate(${p.x}, ${p.y})`} onClick={() => handleMapClick(fortSpace.id, 'fortSpace')} style={{cursor: selectedCardId ? 'crosshair' : 'default'}}>
                  {/* Small fort marker removed per user request */}
                  <circle cx="0" cy="0" r="15" fill="transparent" />
                  
                  {/* Any placed fort pieces */}
                  {fortSpace.forts?.map((piece: any, idx: number) => {
                    const owner = gameState.players.find(pl => pl.id === piece.playerId);
                    const colorMap: Record<string, string> = { red: '#ef4444', blue: '#3b82f6', yellow: '#facc15', green: '#22c55e' };
                    const fill = colorMap[owner?.color || 'red'];
                    return (
                      <rect key={idx} x={-6 + (idx * 4)} y={-6 + (idx * 4)} width="12" height="12" fill={fill} stroke="white" strokeWidth="1" rx="1" />
                    );
                  })}
                </g>
              );
            })}

            {/* Draw nodes */}
            {Object.values(gameState.provinces).map((province) => {
              const p = PROVINCE_COORDS[province.id as keyof typeof PROVINCE_COORDS];
              if (!p) return null;
              
              

              return (
                <g key={province.id} transform={`translate(${p.x}, ${p.y})`} onClick={() => handleMapClick(province.id, 'province')} style={{cursor: selectedCardId ? 'crosshair' : 'default'}}>
                  {/* We only draw the pieces directly over the map coordinate */}
                  {/* Center the pieces grid relative to the coordinate */}
                  <circle cx="0" cy="0" r="25" fill="transparent" />
                  
                  {/* Render the specific token using an emoji if available */}
                  {(province.hasAgricultureToken || province.hasAgricultureToken === undefined) && (
                    <g transform={`translate(${(p as any).token_x - p.x}, ${(p as any).token_y - p.y})`}>
                      <circle cx="0" cy="0" r="12" fill={
                        province.specificToken === 'wheat' ? '#fde047' : 
                        province.specificToken === 'wine' ? '#d8b4fe' : 
                        province.specificToken === 'olive' ? '#86efac' : 
                        province.specificToken === 'thyme' ? '#fdba74' : 
                        province.specificToken === 'cheese' ? '#fef08a' : '#ccc'
                      } stroke="black" strokeWidth="2" />
                      <text x="0" y="4" textAnchor="middle" fontSize="12px">
                         {province.specificToken === 'wheat' ? '🌾' : 
                          province.specificToken === 'wine' ? '🍇' : 
                          province.specificToken === 'olive' ? '🫒' : 
                          province.specificToken === 'thyme' ? '🌿' : 
                          province.specificToken === 'cheese' ? '🧀' : '?'}
                      </text>
                    </g>
                  )}
                  
                  <g transform="translate(0, 0)">
                    {province.pieces.map((piece: any, idx: number) => {
                      const owner = gameState.players.find(pl => pl.id === piece.playerId);
                      const colorMap: Record<string, string> = {
                        red: '#ef4444',
                        blue: '#3b82f6',
                        yellow: '#facc15',
                        green: '#22c55e'
                      };
                      const fill = colorMap[owner?.color || 'red'];
                      
                      // Wrap pieces into multiple rows if needed
                      // Calculate the grid of pieces
                      const maxPerRow = 5;
                      const total = province.pieces.length;
                      const rows = Math.ceil(total / maxPerRow);
                      
                      // Center the entire block around (0,0)
                      // If there is 1 piece, xOffset=0, yOffset=0
                      const rowWidth = Math.min(total, maxPerRow) * 12;
                      const blockHeight = rows * 12;
                      
                      const baseX = (idx % maxPerRow) * 12;
                      const baseY = Math.floor(idx / maxPerRow) * 12;
                      
                      const x = baseX - (rowWidth / 2) + 6; // +6 is half the 12px cell size
                      const y = baseY - (blockHeight / 2) + 6;
                      
                      if (piece.type === 'village') {
                        // Village = Cube (Square)
                        return <rect key={idx} x={x - 5} y={y - 5} width="10" height="10" fill={fill} stroke="white" strokeWidth="1"><title>{piece.type} ({owner?.name})</title></rect>;
                      } else if (piece.type === 'priest') {
                        // Priest = Cylinder (Triangle)
                        return <polygon key={idx} points={`${x},${y - 6} ${x - 5},${y + 5} ${x + 5},${y + 5}`} fill={fill} stroke="white" strokeWidth="1"><title>{piece.type} ({owner?.name})</title></polygon>;
                      } else {
                        // Villager = Disc (Circle)
                        return <circle key={idx} cx={x} cy={y} r="5" fill={fill} stroke="white" strokeWidth="1"><title>{piece.type} ({owner?.name})</title></circle>;
                      }
                    })}
                  </g>
                </g>
              );
            })}
          </svg>

          {gameState.phase === 'lobby' && (
            <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 bg-white p-6 rounded shadow z-20 text-center">
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
          <div className="flex gap-4 overflow-x-auto overflow-y-hidden w-full max-w-full px-4 pb-2 justify-center">
            {currentPlayer.availableCards.map(card => (
              <button
                key={card.id}
                disabled={gameState.activePlayerId !== playerId || gameState.phase !== 'playing'}
                onClick={() => playCard(card)}
                className="flex-shrink-0 w-32 h-40 bg-white border-2 border-gray-400 rounded-lg shadow hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col p-2"
              >
                <div className="font-bold text-sm text-center border-b pb-1 mb-1">{card.name}</div>
                <div className="text-xs text-gray-600 flex-grow">{card.effectDescription}</div>
                <div className="text-xs font-mono text-gray-400 text-right">{card.effectType}</div>
              </button>
            ))}
            
            {currentPlayer.playedCard && (
              <div className="flex-shrink-0 w-32 h-40 bg-blue-100 border-2 border-blue-400 rounded-lg shadow flex flex-col p-2 opacity-75">
                <div className="font-bold text-sm text-center border-b pb-1 mb-1 text-blue-900">{currentPlayer.playedCard.name}</div>
                <div className="text-xs text-blue-700 flex-grow">{currentPlayer.playedCard.effectDescription}</div>
                <div className="text-xs font-bold text-blue-800 text-center uppercase mt-auto pb-1">PLAYED</div>
              </div>
            )}
          </div>
        )}
      </footer>
      
        {gameState.phase === 'sentinel_reveal' && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded shadow-lg max-w-md text-center">
              <h2 className="text-2xl font-bold mb-4">Sentinel Played!</h2>
              <p className="mb-4">The leftmost fort card has been scored and discarded.</p>
              <p className="mb-6">The next Fort Card in the row was revealed: <span className="font-bold text-lg text-blue-800">{gameState.fortCardRow[1]?.id}</span></p>
              {playerId === gameState.activePlayerId ? (
                <>
                  <p className="mb-4 font-bold">Would you like to keep this card, or discard it to the bottom of the deck and draw a new one?</p>
                  <div className="flex justify-center gap-4 mt-6">
                    <button onClick={() => handleSentinelReveal(true)} className="px-6 py-3 bg-green-500 text-white font-bold rounded hover:bg-green-600 shadow">Keep Card</button>
                    <button onClick={() => handleSentinelReveal(false)} className="px-6 py-3 bg-red-500 text-white font-bold rounded hover:bg-red-600 shadow">Discard & Replace</button>
                  </div>
                </>
              ) : (
                <p className="font-bold text-gray-600 mt-6">Waiting for active player to decide whether to keep or replace the revealed card...</p>
              )}
            </div>
          </div>
        )}
        
    </div>
  );
}

export default App;
