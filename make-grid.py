import cv2
import numpy as np

img = cv2.imread('apps/frontend/src/assets/map.png')
h, w = img.shape[:2]

spacing_x = w // 5
spacing_y = h // 5

count = 1
for i in range(1, 5):
    for j in range(1, 5):
        cx = j * spacing_x
        cy = i * spacing_y
        cv2.circle(img, (cx, cy), 15, (0, 0, 255), -1)
        cv2.putText(img, str(count), (cx - 10, cy + 5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        count += 1

cv2.imwrite('numbered_map.png', img)
