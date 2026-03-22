with open('apps/frontend/src/App.tsx', 'r') as f:
    content = f.read()

old_logic = """                      const x = baseX - (rowWidth / 2) + 6; // +6 is half the 12px cell size
                      const y = baseY - (blockHeight / 2) + 6;
                      
                      return (
                        <circle key={idx} cx={x} cy={y} r="5" fill={fill} stroke="black" strokeWidth="1">
                          <title>{piece.type} ({owner?.name})</title>
                        </circle>
                      );
                    })}"""

new_logic = """                      const x = baseX - (rowWidth / 2) + 6; // +6 is half the 12px cell size
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
                    })}"""

content = content.replace(old_logic, new_logic)

with open('apps/frontend/src/App.tsx', 'w') as f:
    f.write(content)

