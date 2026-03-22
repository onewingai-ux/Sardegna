import cv2
import pytesseract
from pytesseract import Output

# Load the image
img = cv2.imread('apps/frontend/src/assets/map.png')
# Convert to grayscale for better OCR
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

d = pytesseract.image_to_data(gray, output_type=Output.DICT)
n_boxes = len(d['level'])

print("Searching for specific province labels...")
found = {}

target_names = [
    "Sassari", "Castelsardo", "Olbia", "Alghero", "Bosa", 
    "Macomer", "Nuoro", "Dorgali", "Oristano", "Sorgono", 
    "Lanusei", "Iglesias", "Sanluri", "Muravera", "Carbonia", "Cagliari"
]

for i in range(n_boxes):
    text = d['text'][i].strip()
    if not text:
        continue
        
    for name in target_names:
        if name.lower() in text.lower():
            (x, y, w, h) = (d['left'][i], d['top'][i], d['width'][i], d['height'][i])
            found[name] = (x + w//2, y + h//2)

print("Found Coordinates:")
print(found)
