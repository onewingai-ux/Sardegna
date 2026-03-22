import cv2
import numpy as np
import json

img = cv2.imread('apps/frontend/src/assets/map.png')
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
edges = cv2.Canny(gray, 100, 200)
contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

filtered_centroids = []
for c in contours:
    area = cv2.contourArea(c)
    # We want perfectly round, small black or red dots inside the map, NOT UI elements on the border.
    if 30 < area < 500:
        perimeter = cv2.arcLength(c, True)
        if perimeter == 0: continue
        circularity = 4 * np.pi * (area / (perimeter * perimeter))
        
        if circularity > 0.6:
            M = cv2.moments(c)
            if M["m00"] != 0:
                cX = int(M["m10"] / M["m00"])
                cY = int(M["m01"] / M["m00"])
                
                # Exclude edge UI dots (x < 200, x > 800, y < 100, y > 900)
                if cX > 200 and cX < 800 and cY > 100 and cY < 900:
                    filtered_centroids.append((cX, cY))

# Merge close
grouped = []
for (x, y) in filtered_centroids:
    found = False
    for i, (gx, gy) in enumerate(grouped):
        if np.sqrt((x-gx)**2 + (y-gy)**2) < 20:
            grouped[i] = ((gx+x)//2, (gy+y)//2)
            found = True
            break
    if not found:
        grouped.append((x, y))

# Let's see if we get exactly 16!
print(f"Found {len(grouped)} internal map dots.")
grouped = sorted(grouped, key=lambda p: p[1]) # Sort top to bottom

for i, (x, y) in enumerate(grouped):
    print(f"Dot {i+1}: ({x}, {y})")

