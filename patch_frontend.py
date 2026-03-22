import re

with open('apps/frontend/src/App.tsx', 'r') as f:
    content = f.read()

fort_coords = """
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
"""

# Insert FORT_COORDS after PROVINCE_COORDS
pattern = re.compile(r'(const PROVINCE_COORDS = \{[^\}]+\};)')
content = pattern.sub(r'\1\n' + fort_coords, content, count=1)

with open('apps/frontend/src/App.tsx', 'w') as f:
    f.write(content)
