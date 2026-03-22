import cv2
import numpy as np

img = cv2.imread('apps/frontend/src/assets/map.png')
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
gray_blurred = cv2.medianBlur(gray, 5)

# 1. Hough Circles (detect perfectly circular dots)
circles = cv2.HoughCircles(
    gray_blurred, 
    cv2.HOUGH_GRADIENT, 
    dp=1.2, 
    minDist=30, 
    param1=50, 
    param2=30, 
    minRadius=5, 
    maxRadius=50
)

if circles is not None:
    circles = np.uint16(np.around(circles))
    print(f"HoughCircles found {len(circles[0])} circles:")
    for i in circles[0, :]:
        print(f"({i[0]}, {i[1]}) r={i[2]}")
else:
    print("HoughCircles found no circles.")

# 2. Contours based on color or edge (if they aren't perfect circles)
edges = cv2.Canny(gray, 100, 200)
contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

filtered_centroids = []
for c in contours:
    area = cv2.contourArea(c)
    # A typical dot might be between 50 and 1000 pixels in area
    if 50 < area < 2000:
        perimeter = cv2.arcLength(c, True)
        if perimeter == 0: continue
        circularity = 4 * np.pi * (area / (perimeter * perimeter))
        
        # If it's somewhat circular
        if circularity > 0.6:
            M = cv2.moments(c)
            if M["m00"] != 0:
                cX = int(M["m10"] / M["m00"])
                cY = int(M["m01"] / M["m00"])
                filtered_centroids.append((cX, cY, area, circularity))

# Group close centroids together since contours might catch inner/outer edges
grouped = []
for (x, y, a, c_ity) in filtered_centroids:
    found = False
    for i, (gx, gy, ga, gc) in enumerate(grouped):
        # If distance < 20 pixels, merge them
        if np.sqrt((x-gx)**2 + (y-gy)**2) < 20:
            found = True
            break
    if not found:
        grouped.append((x, y, a, c_ity))

print(f"\nContour circularity found {len(grouped)} potential dots:")
for i, (x, y, a, c_ity) in enumerate(grouped):
    print(f"({x}, {y}) area={a:.1f} circ={c_ity:.2f}")

