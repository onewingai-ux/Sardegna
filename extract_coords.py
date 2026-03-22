import cv2
import numpy as np

# Load the image
img = cv2.imread('/app/new_map.png')
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Apply a threshold or edge detection depending on what the markers look like
# Assuming there are distinctive circular markers or text for the 16 provinces
# Let's try to detect circles first
circles = cv2.HoughCircles(gray, cv2.HOUGH_GRADIENT, dp=1.2, minDist=30, param1=50, param2=30, minRadius=10, maxRadius=50)

if circles is not None:
    circles = np.round(circles[0, :]).astype("int")
    for (x, y, r) in circles:
        print(f"Found circle at x:{x}, y:{y}, r:{r}")
else:
    print("No circles found.")

# Try thresholding and contour detection
ret, thresh = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)
contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

valid_contours = []
for cnt in contours:
    area = cv2.contourArea(cnt)
    if area > 100 and area < 5000: # Adjust thresholds as needed
        M = cv2.moments(cnt)
        if M["m00"] != 0:
            cX = int(M["m10"] / M["m00"])
            cY = int(M["m01"] / M["m00"])
            valid_contours.append((cX, cY))

print(f"Found {len(valid_contours)} valid contours.")
# We can output the coordinates to see if they make sense
# for (x, y) in valid_contours:
#    print(f"Contour at x:{x}, y:{y}")

