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

  

  const getCardIcon = (effectType: string) => {
    switch(effectType) {
      case 'move_priest': return '🔺';
      case 'sentinel': return '🛡️';
      case 'place_villager': return '🧑‍🌾';
      case 'place_village': return '🏘️';
      case 'place_ship': return '⛵';
      case 'place_fort': return '🏰';
      case 'take_token': return '🌾';
      default: return '🃏';
    }
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
      <header className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-3 shadow-lg border-b-4 border-yellow-500 flex flex-col md:flex-row justify-between items-center gap-3 z-50">
        <div className="flex items-center gap-3">
            <div className="bg-yellow-500 text-blue-900 font-black px-3 py-1 rounded shadow drop-shadow text-sm uppercase tracking-widest">
              Sardegna
            </div>
            <span className="text-sm opacity-80 font-mono bg-black bg-opacity-30 px-2 py-0.5 rounded">ID: {gameState.id}</span>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {gameState.players.map(p => {
             const colorMap: Record<string, string> = { red: 'bg-red-500', blue: 'bg-blue-500', yellow: 'bg-yellow-400', green: 'bg-green-500' };
             const bg = colorMap[p.color] || 'bg-gray-500';
             const isTurn = gameState.activePlayerId === p.id;
             const isMe = p.id === playerId;
             
             return (
              <div key={p.id} className={`relative flex items-center gap-3 px-4 py-1.5 rounded-full border-2 transition-all duration-300 ${isTurn ? 'border-yellow-400 bg-black bg-opacity-40 shadow-[0_0_15px_rgba(250,204,21,0.3)] scale-105' : 'border-transparent bg-black bg-opacity-20'}`}>
                <div className={`w-4 h-4 rounded-full ${bg} shadow-inner border border-white/50`}></div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold leading-tight">
                    {p.name} {isMe && <span className="opacity-70 font-normal">(You)</span>}
                  </span>
                  {isTurn && <span className="text-[9px] uppercase tracking-widest text-yellow-400 font-bold leading-none animate-pulse">Thinking...</span>}
                </div>
                <div className="ml-2 bg-white text-gray-900 font-black px-2 py-0.5 rounded shadow text-sm">
                  {p.score} <span className="text-[10px] text-gray-500">VP</span>
                </div>
              </div>
            );
          })}
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-grow flex flex-col p-2 sm:p-4 gap-2 sm:gap-4 overflow-hidden relative">
      
        {/* Subtle Sentinel Banner */}
        {gameState.phase === 'sentinel_reveal' && (
          <div className="w-full bg-blue-900 text-white p-3 rounded shadow-md z-40 flex flex-col md:flex-row items-center justify-between px-4 sm:px-6 flex-shrink-0 gap-3">
            <div className="text-center md:text-left">
              <h2 className="font-bold text-base sm:text-lg flex justify-center md:justify-start items-center gap-2">
                🛡️ Sentinel Scoring Complete
              </h2>
              <p className="text-xs sm:text-sm opacity-90">Revealed next card: <span className="font-bold text-yellow-300">{gameState.fortCardRow[1]?.id}</span></p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full md:w-auto">
              {playerId === gameState.activePlayerId ? (
                <>
                  <span className="mr-2 text-sm font-bold">Keep or Replace?</span>
                  <button onClick={() => handleSentinelReveal(true)} className="px-4 py-1.5 bg-green-500 text-white text-sm font-bold rounded hover:bg-green-600 transition shadow">Keep Card</button>
                  <button onClick={() => handleSentinelReveal(false)} className="px-4 py-1.5 bg-red-500 text-white text-sm font-bold rounded hover:bg-red-600 transition shadow">Discard & Replace</button>
                </>
              ) : (
                <span className="text-sm italic opacity-80">Waiting for active player to decide...</span>
              )}
            </div>
          </div>
        )}
        
        <div className="flex-grow flex flex-col lg:flex-row gap-2 sm:gap-4 overflow-y-auto lg:overflow-hidden w-full max-w-full">
          {/* Left: Board View */}
          <div className="flex-grow bg-blue-100 rounded border border-blue-300 relative p-0 lg:p-4 overflow-hidden min-h-[300px] lg:min-h-[400px] flex justify-center items-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 absolute top-2 left-2 sm:top-4 sm:left-4 z-10">Board View</h2>
          
          
          {/* We now lock the SVG to the same aspect ratio container. The map image is rendered INSIDE the SVG to guarantee the coordinate system perfectly matches the pixels of the calibration. */}
          <svg className="w-full h-full max-w-[800px] max-h-[800px] absolute inset-0 m-auto drop-shadow-xl" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid meet">
            <defs>
              <filter id="tokenShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.5" />
              </filter>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="white" floodOpacity="0.8" />
              </filter>
            </defs>
            
            <image href={mapImage} x="0" y="0" width="800" height="800" preserveAspectRatio="xMidYMid meet" opacity="0.9" />
                                    {/* Draw harbors */}
            {Object.values(gameState.harbors || {}).map((harbor) => {
              const p = HARBOR_COORDS[harbor.id as keyof typeof HARBOR_COORDS];
              if (!p) return null;
              
              return (
                <g key={harbor.id} transform={`translate(${p.x}, ${p.y})`} onClick={() => handleMapClick(harbor.id, 'harbor')} style={{cursor: 'pointer', touchAction: 'manipulation'}} filter={selectedCardId ? 'url(#glow)' : ''} className={selectedCardId ? 'animate-pulse hover:opacity-75 transition' : ''}>
                  <circle cx="0" cy="0" r="20" fill="transparent" style={{cursor: "pointer", pointerEvents: "all"}} />
                  
                  {/* Any placed ships */}
                  {harbor.ships?.map((piece: any, idx: number) => {
                    const owner = gameState.players.find(pl => pl.id === piece.playerId);
                    const colorMap: Record<string, string> = { red: '#ef4444', blue: '#3b82f6', yellow: '#facc15', green: '#22c55e' };
                    const fill = colorMap[owner?.color || 'red'];
                    return (
                      <ellipse key={idx} cx={-8 + (idx * 16)} cy="0" rx="8" ry="4" fill={fill} stroke="white" strokeWidth="1" filter="url(#tokenShadow)" />
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
                <g key={fortSpace.id} transform={`translate(${p.x}, ${p.y})`} onClick={() => handleMapClick(fortSpace.id, 'fortSpace')} style={{cursor: 'pointer', touchAction: 'manipulation'}} filter={selectedCardId ? 'url(#glow)' : ''} className={selectedCardId ? 'animate-pulse hover:opacity-75 transition' : ''}>
                  {/* Small fort marker removed per user request */}
                  <circle cx="0" cy="0" r="20" fill="transparent" style={{cursor: "pointer", pointerEvents: "all"}} />
                  
                  {/* Any placed fort pieces */}
                  {fortSpace.forts?.map((piece: any, idx: number) => {
                    const owner = gameState.players.find(pl => pl.id === piece.playerId);
                    const colorMap: Record<string, string> = { red: '#ef4444', blue: '#3b82f6', yellow: '#facc15', green: '#22c55e' };
                    const fill = colorMap[owner?.color || 'red'];
                    return (
                      <rect key={idx} x={-6 + (idx * 4)} y={-6 + (idx * 4)} width="12" height="12" fill={fill} stroke="white" strokeWidth="1" rx="1" filter="url(#tokenShadow)" />
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
                <g key={province.id} transform={`translate(${p.x}, ${p.y})`} onClick={() => handleMapClick(province.id, 'province')} style={{cursor: 'pointer', touchAction: 'manipulation'}} filter={selectedCardId ? 'url(#glow)' : ''} className={selectedCardId ? 'animate-pulse hover:opacity-75 transition' : ''}>
                  {/* We only draw the pieces directly over the map coordinate */}
                  {/* Center the pieces grid relative to the coordinate */}
                  <circle cx="0" cy="0" r="30" fill="transparent" style={{cursor: "pointer", pointerEvents: "all"}} />
                  
                  {/* Render the specific token using an emoji if available */}
                  {(province.hasAgricultureToken || province.hasAgricultureToken === undefined) && (
                    <g transform={`translate(${(p as any).token_x - p.x}, ${(p as any).token_y - p.y})`}>
                      <circle cx="0" cy="0" r="12" fill={
                        province.specificToken === 'wheat' ? '#fde047' : 
                        province.specificToken === 'wine' ? '#d8b4fe' : 
                        province.specificToken === 'olive' ? '#86efac' : 
                        province.specificToken === 'thyme' ? '#fdba74' : 
                        province.specificToken === 'cheese' ? '#fef08a' : '#ccc'
                      } stroke="black" strokeWidth="2" filter="url(#tokenShadow)" />
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
                        return <rect key={idx} x={x - 5} y={y - 5} width="10" height="10" fill={fill} stroke="white" strokeWidth="1" filter="url(#tokenShadow)"><title>{piece.type} ({owner?.name})</title></rect>;
                      } else if (piece.type === 'priest') {
                        // Priest = Cylinder (Triangle)
                        return <polygon key={idx} points={`${x},${y - 6} ${x - 5},${y + 5} ${x + 5},${y + 5}`} fill={fill} stroke="white" strokeWidth="1" filter="url(#tokenShadow)"><title>{piece.type} ({owner?.name})</title></polygon>;
                      } else {
                        // Villager = Disc (Circle)
                        return <circle key={idx} cx={x} cy={y} r="5" fill={fill} stroke="white" strokeWidth="1" filter="url(#tokenShadow)"><title>{piece.type} ({owner?.name})</title></circle>;
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
           <div className="bg-white p-4 rounded shadow border flex-grow overflow-y-auto min-h-[150px]">
             <h3 className="font-bold border-b mb-2 pb-1">Log</h3>
             <ul className="text-sm text-gray-700">
               {[...gameState.log].reverse().map((entry, idx) => (
                 <li key={idx} className="mb-1">{entry}</li>
               ))}
             </ul>
           </div>
        </div>
      </div>

      </main>

      {/* Footer / Player Hand */}
      <footer className="bg-gray-200 p-2 border-t h-auto sm:h-48 flex flex-col justify-center items-center z-40 relative flex-shrink-0">
        {gameState.activePlayerId === playerId ? (
          <div className="text-green-600 font-bold mb-2 text-sm sm:text-base">It's your turn!</div>
        ) : (
          <div className="text-gray-500 mb-2 text-sm sm:text-base">Waiting for other players...</div>
        )}
        
        {currentPlayer && (
          <div className="flex gap-2 sm:gap-4 items-center overflow-x-auto overflow-y-hidden w-full max-w-full px-2 sm:px-4 pb-2 justify-start sm:justify-center" style={{ WebkitOverflowScrolling: 'touch' }}>
            {currentPlayer.availableCards.map(card => {
              const isSelected = selectedCardId === card.id;
              return (
              <button
                key={card.id}
                disabled={gameState.activePlayerId !== playerId || gameState.phase !== 'playing'}
                onClick={() => playCard(card)}
                className={`flex-shrink-0 w-32 sm:w-36 h-44 sm:h-52 bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex flex-col items-center justify-between p-3 transition-all duration-200 relative overflow-hidden border-[3px] 
                  ${isSelected ? 'border-yellow-400 -translate-y-4 shadow-[0_8px_20px_rgba(250,204,21,0.4)]' : 'border-gray-200 hover:-translate-y-2 hover:shadow-[0_8px_16px_rgba(0,0,0,0.2)] hover:border-blue-300'} 
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] disabled:hover:border-gray-200`}
              >
                {/* Decorative card header */}
                <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-blue-100 to-transparent"></div>
                
                <div className="z-10 flex flex-col items-center w-full">
                  <div className="text-2xl mb-1 drop-shadow-md">{getCardIcon(card.effectType)}</div>
                  <div className="font-extrabold text-sm sm:text-base text-gray-800 text-center uppercase tracking-wide border-b border-gray-300 w-full pb-1 mb-2">{card.name}</div>
                </div>
                
                <div className="text-[10px] sm:text-xs text-gray-600 flex-grow flex items-center text-center font-medium leading-snug px-1">
                   {card.effectDescription}
                </div>
                
                {isSelected && card.effectType !== 'sentinel' && (
                   <div className="absolute bottom-0 left-0 w-full bg-yellow-400 text-yellow-900 text-[10px] font-bold py-1 text-center animate-pulse">
                     CLICK MAP TARGET
                   </div>
                )}
              </button>
              );
            })}
            
            {currentPlayer.playedCard && (
              <div className="flex-shrink-0 w-32 sm:w-36 h-44 sm:h-52 bg-gray-100 border-[3px] border-dashed border-gray-400 rounded-xl shadow-inner flex flex-col items-center justify-center p-3 opacity-60 relative overflow-hidden">
                <div className="absolute inset-0 bg-gray-300 opacity-20 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:8px_8px]"></div>
                <div className="text-3xl grayscale opacity-50 mb-2">{getCardIcon(currentPlayer.playedCard.effectType)}</div>
                <div className="font-bold text-sm sm:text-base text-gray-500 text-center uppercase mb-1">{currentPlayer.playedCard.name}</div>
                <div className="bg-gray-700 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow">PLAYED</div>
              </div>
            )}
          </div>
        )}
      </footer>
      

        
    </div>
  );
}

export default App;
