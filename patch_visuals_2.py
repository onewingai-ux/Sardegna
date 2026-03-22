import re

with open('apps/frontend/src/App.tsx', 'r') as f:
    content = f.read()

old_draw_pieces = """                      const rIdx = Math.floor(idx / maxPerRow);
                      const cIdx = idx % maxPerRow;
                      const cx = startX + cIdx * 12;
                      const cy = startY + rIdx * 12;
                      
                      return (
                        <circle key={idx} cx={cx} cy={cy} r="5" fill={fill} stroke="white" strokeWidth="1" />
                      );"""

new_draw_pieces = """                      const rIdx = Math.floor(idx / maxPerRow);
                      const cIdx = idx % maxPerRow;
                      const cx = startX + cIdx * 12;
                      const cy = startY + rIdx * 12;
                      
                      if (piece.type === 'village') {
                        // Village = Cube (Square)
                        return <rect key={idx} x={cx - 5} y={cy - 5} width="10" height="10" fill={fill} stroke="white" strokeWidth="1" />;
                      } else if (piece.type === 'priest') {
                        // Priest = Cylinder (Triangle)
                        return <polygon key={idx} points={`${cx},${cy - 6} ${cx - 5},${cy + 5} ${cx + 5},${cy + 5}`} fill={fill} stroke="white" strokeWidth="1" />;
                      } else {
                        // Villager = Disc (Circle)
                        return <circle key={idx} cx={cx} cy={cy} r="5" fill={fill} stroke="white" strokeWidth="1" />;
                      }"""

content = content.replace(old_draw_pieces, new_draw_pieces)

with open('apps/frontend/src/App.tsx', 'w') as f:
    f.write(content)
