import re

with open('apps/frontend/src/App.tsx', 'r') as f:
    content = f.read()

# Ah, the bottom of the file is different
old_ui = """            )}
          </div>
        )}
      </footer>
    </div>
  );
}

export default App;"""

new_ui = """            )}
          </div>
        )}
      </footer>
      
        {gameState.phase === 'sentinel_reveal' && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded shadow-lg max-w-sm text-center">
              <h2 className="text-2xl font-bold mb-4">Sentinel Played!</h2>
              <p className="mb-6">The leftmost fort card has been scored and discarded.</p>
              {playerId === gameState.activePlayerId ? (
                <>
                  <p className="mb-4 font-bold">How many new fort cards would you like to reveal from the deck?</p>
                  <div className="flex justify-center gap-4">
                    <button onClick={() => handleSentinelReveal(1)} className="px-6 py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-600">Reveal 1 Card</button>
                    <button onClick={() => handleSentinelReveal(2)} className="px-6 py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-600">Reveal 2 Cards</button>
                  </div>
                </>
              ) : (
                <p className="font-bold text-gray-600">Waiting for active player to choose how many fort cards to reveal...</p>
              )}
            </div>
          </div>
        )}
        
    </div>
  );
}

export default App;"""

content = content.replace(old_ui, new_ui)

with open('apps/frontend/src/App.tsx', 'w') as f:
    f.write(content)
