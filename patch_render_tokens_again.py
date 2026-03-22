import re

with open('apps/frontend/src/App.tsx', 'r') as f:
    content = f.read()

# 1. Add player HUD for tokens
old_hud = """              <div key={p.id} className={`p-4 rounded shadow border-l-4 ${p.id === gameState.activePlayerId ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-white'}`}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-lg">{p.name}</h3>
                  <div className="flex items-center gap-2">
                     <span className={`w-3 h-3 rounded-full bg-${p.color}-500 inline-block`}></span>
                     <span className="font-bold">{p.score} VP</span>
                  </div>
                </div>"""

new_hud = """              <div key={p.id} className={`p-4 rounded shadow border-l-4 ${p.id === gameState.activePlayerId ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-white'}`}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-lg">{p.name}</h3>
                  <div className="flex items-center gap-2">
                     <span className={`w-3 h-3 rounded-full bg-${p.color}-500 inline-block`}></span>
                     <span className="font-bold">{p.score} VP</span>
                  </div>
                </div>
                {p.tokens && (
                  <div className="flex gap-2 text-xs text-gray-600 mb-2">
                    <span className="px-2 py-1 bg-yellow-100 border border-yellow-300 rounded">Wheat: {p.tokens.wheat || 0}</span>
                    <span className="px-2 py-1 bg-green-100 border border-green-300 rounded">Wine/Olive: {p.tokens.wine_olive || 0}</span>
                    <span className="px-2 py-1 bg-orange-100 border border-orange-300 rounded">Thyme/Cheese: {p.tokens.thyme_cheese || 0}</span>
                  </div>
                )}"""

content = content.replace(old_hud, new_hud)

# 2. Render tokens on the map
old_prov = """              return (
                <g key={province.id} transform={`translate(${p.x}, ${p.y})`} onClick={() => handleMapClick(province.id, 'province')} style={{cursor: selectedCardId ? 'crosshair' : 'default'}}>
                  {/* Center the pieces grid relative to the coordinate */}
                  <circle cx="0" cy="0" r="25" fill="transparent" />
                  <g transform="translate(0, 0)">"""

new_prov = """              return (
                <g key={province.id} transform={`translate(${p.x}, ${p.y})`} onClick={() => handleMapClick(province.id, 'province')} style={{cursor: selectedCardId ? 'crosshair' : 'default'}}>
                  {/* Center the pieces grid relative to the coordinate */}
                  <circle cx="0" cy="0" r="25" fill="transparent" />
                  
                  {/* Provide a fallback in case state.hasAgricultureToken isn't present in old games */}
                  {(province.hasAgricultureToken || province.hasAgricultureToken === undefined) && (
                    <g transform="translate(0, -25)">
                      <circle cx="0" cy="0" r="8" fill={province.resource === 'wheat' ? '#fde047' : province.resource === 'wine_olive' ? '#86efac' : '#fdba74'} stroke="black" strokeWidth="1" />
                    </g>
                  )}
                  
                  <g transform="translate(0, 0)">"""

content = content.replace(old_prov, new_prov)

with open('apps/frontend/src/App.tsx', 'w') as f:
    f.write(content)
