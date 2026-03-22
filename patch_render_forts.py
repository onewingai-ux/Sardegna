with open('apps/frontend/src/App.tsx', 'r') as f:
    content = f.read()

render_forts = """            {/* Draw forts */}
            {Object.values(gameState.fortSpaces || {}).map((fortSpace) => {
              const p = FORT_COORDS[fortSpace.id as keyof typeof FORT_COORDS];
              if (!p) return null;
              
              return (
                <g key={fortSpace.id} transform={`translate(${p.x}, ${p.y})`}>
                  {/* Small fort marker underneath pieces */}
                  <rect x="-8" y="-8" width="16" height="16" fill="#333" rx="2" />
                  
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
"""

content = content.replace("{/* Draw nodes */}", render_forts + "\n            {/* Draw nodes */}")

with open('apps/frontend/src/App.tsx', 'w') as f:
    f.write(content)
