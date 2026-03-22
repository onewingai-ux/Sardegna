import re

with open('apps/frontend/src/App.tsx', 'r') as f:
    content = f.read()

new_coords = """const PROVINCE_COORDS = {
  p1: { x: 278, y: 148 },
  p2: { x: 381, y: 149 },
  p3: { x: 427, y: 89 },
  p4: { x: 290, y: 235 },
  p5: { x: 473, y: 164 },
  p6: { x: 357, y: 313 },
  p7: { x: 450, y: 267 },
  p8: { x: 574, y: 224 },
  p9: { x: 375, y: 389 },
  p10: { x: 456, y: 375 },
  p11: { x: 330, y: 528 },
  p12: { x: 441, y: 477 },
  p13: { x: 517, y: 462 },
  p14: { x: 267, y: 588 },
  p15: { x: 381, y: 606 },
  p16: { x: 501, y: 603 },
};"""

# The regex needs to be non-greedy to just match the object
pattern = re.compile(r'const PROVINCE_COORDS = \{.*?\};', re.DOTALL)
content = pattern.sub(new_coords, content, count=1)

with open('apps/frontend/src/App.tsx', 'w') as f:
    f.write(content)
