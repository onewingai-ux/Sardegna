import cv2
import numpy as np

# Read image
image = cv2.imread('apps/frontend/src/assets/map.png')
original = image.copy()
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

# Find circles or distinct markers on the map?
# We don't know what the map looks like. Let's find large text or colored blobs.
# Or better: let's try finding the dots that the user says are "not lining up where they should be".
# Actually, the user says "you need to look at the image, determine where the zones are on that image and then map it to that".

# Let's extract the image edges/contours to find the zones
edged = cv2.Canny(gray, 50, 150)
contours, _ = cv2.findContours(edged, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

# Let's sort contours by area to find the largest distinct zones
contours = sorted(contours, key=cv2.contourArea, reverse=True)[:20]

print("Found", len(contours), "contours.")

centroids = []
for c in contours:
    M = cv2.moments(c)
    if M["m00"] != 0:
        cX = int(M["m10"] / M["m00"])
        cY = int(M["m01"] / M["m00"])
        centroids.append((cX, cY, cv2.contourArea(c)))
        
# Sort by Y first, then X
centroids = sorted(centroids, key=lambda p: (p[1], p[0]))

for i, (x, y, a) in enumerate(centroids):
    print(f"Zone {i+1}: ({x}, {y}) Area: {a}")
