import cv2
import numpy as np

img = cv2.imread('apps/frontend/src/assets/map.png')
h, w = img.shape[:2]

# Draw a much denser 8x8 grid with crosshairs instead of giant circles
spacing_x = w // 8
spacing_y = h // 8

# Darken image slightly so text pops
overlay = img.copy()
cv2.rectangle(overlay, (0, 0), (w, h), (0, 0, 0), -1)
cv2.addWeighted(overlay, 0.4, img, 0.6, 0, img)

count = 1
for i in range(1, 8):
    for j in range(1, 8):
        cx = j * spacing_x
        cy = i * spacing_y
        cv2.drawMarker(img, (cx, cy), (0, 255, 0), markerType=cv2.MARKER_CROSS, markerSize=10, thickness=2)
        cv2.putText(img, str(count), (cx + 5, cy - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
        count += 1

cv2.imwrite('numbered_map_dense.png', img)
