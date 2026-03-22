import cv2
import pytesseract
from pytesseract import Output

img = cv2.imread('apps/frontend/src/assets/map.png')
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Binarize the image to improve OCR
_, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)

d = pytesseract.image_to_data(thresh, output_type=Output.DICT)
n_boxes = len(d['level'])

print("All OCR texts detected:")
for i in range(n_boxes):
    text = d['text'][i].strip()
    if len(text) > 3:
        print(f"'{text}' at ({d['left'][i]}, {d['top'][i]})")
