const fs = require('fs');
const image = fs.readFileSync('/app/new_map.png');
const base64Image = image.toString('base64');

const html = `
<!DOCTYPE html>
<html>
<head><title>Map Picker</title><style>body{text-align:center;font-family:sans-serif;}svg{max-width:800px;border:2px solid #ccc;cursor:crosshair;}pre{text-align:left;display:inline-block;background:#eee;padding:20px;min-width:300px;font-size:16px;}</style></head>
<body>
<h3>Click the center of the 16 Provinces exactly as they appear in the rules:</h3>
<p>1: Sassari, 2: Castelsardo, 3: Olbia, 4: Alghero, 5: Bosa, 6: Macomer, 7: Nuoro, 8: Dorgali, 9: Oristano, 10: Sorgono, 11: Lanusei, 12: Iglesias, 13: Sanluri, 14: Muravera, 15: Carbonia, 16: Cagliari</p>
<div style="display:flex; justify-content:center; gap: 20px;">
  <div>
    <svg id="mapsvg" width="800" height="800" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid meet">
      <image href="data:image/png;base64,${base64Image}" x="0" y="0" width="800" height="800" preserveAspectRatio="xMidYMid meet" opacity="0.8" />
    </svg>
  </div>
  <div>
    <pre id="output">const PROVINCE_COORDS = {\n</pre>
  </div>
</div>
<script>
let count = 1;
document.getElementById('mapsvg').addEventListener('click', (e) => {
    if(count > 16) return;
    const svg = document.getElementById('mapsvg');
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    
    const x = Math.round(svgP.x);
    const y = Math.round(svgP.y);
    
    document.getElementById('output').innerText += \`  p\${count}: { x: \${x}, y: \${y} },\n\`;
    if(count === 16) document.getElementById('output').innerText += '};';
    
    // Draw a small circle where clicked to verify
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', '10');
    circle.setAttribute('fill', 'red');
    svg.appendChild(circle);

    // Add text label
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x + 15);
    text.setAttribute('y', y + 5);
    text.setAttribute('fill', 'white');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('font-size', '16px');
    text.textContent = 'p' + count;
    // adding background to text for better visibility
    const textBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    textBg.setAttribute('x', x + 13);
    textBg.setAttribute('y', y - 10);
    textBg.setAttribute('width', '30');
    textBg.setAttribute('height', '20');
    textBg.setAttribute('fill', 'black');
    svg.appendChild(textBg);
    svg.appendChild(text);

    count++;
});
</script>
</body>
</html>
`;

console.log('data:text/html;base64,' + Buffer.from(html).toString('base64'));
