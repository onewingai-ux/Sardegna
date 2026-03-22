with open('apps/frontend/src/App.tsx', 'r') as f:
    content = f.read()

old_draw_pieces = """                    {province.pieces.map((piece: any, idx: number) => {
                      const owner = gameState.players.find(pl => pl.id === piece.playerId);
                      const colorMap: Record<string, string> = {
                        red: '#ef4444',
                        blue: '#3b82f6',
                        yellow: '#facc15',
                        green: '#22c55e'
                      };
                      const fill = colorMap[owner?.color || 'red'];
                      
                      // Wrap pieces into multiple rows if needed
                      const row = Math.floor(idx / 3);
                      const col = idx % 3;
                      const ox = -15 + col * 15;
                      const oy = -10 + row * 15;
                      
                      return (
                        <circle key={idx} cx={ox} cy={oy} r="6" fill={fill} stroke="white" strokeWidth="1" />
                      );
                    })}"""

new_draw_pieces = """                    {province.pieces.map((piece: any, idx: number) => {
                      const owner = gameState.players.find(pl => pl.id === piece.playerId);
                      const colorMap: Record<string, string> = {
                        red: '#ef4444',
                        blue: '#3b82f6',
                        yellow: '#facc15',
                        green: '#22c55e'
                      };
                      const fill = colorMap[owner?.color || 'red'];
                      
                      // Wrap pieces into multiple rows if needed
                      const row = Math.floor(idx / 3);
                      const col = idx % 3;
                      const ox = -15 + col * 15;
                      const oy = -10 + row * 15;
                      
                      if (piece.type === 'village') {
                        // Village = Cube (Square)
                        return <rect key={idx} x={ox - 6} y={oy - 6} width="12" height="12" fill={fill} stroke="white" strokeWidth="1" />;
                      } else if (piece.type === 'priest') {
                        // Priest = Cylinder (Triangle)
                        return <polygon key={idx} points={`${ox},${oy - 7} ${ox - 6},${oy + 6} ${ox + 6},${oy + 6}`} fill={fill} stroke="white" strokeWidth="1" />;
                      } else {
                        // Villager = Disc (Circle)
                        return <circle key={idx} cx={ox} cy={oy} r="6" fill={fill} stroke="white" strokeWidth="1" />;
                      }
                    })}"""

content = content.replace(old_draw_pieces, new_draw_pieces)

with open('apps/frontend/src/App.tsx', 'w') as f:
    f.write(content)
