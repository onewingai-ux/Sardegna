const fs = require('fs');

const html = `
<!DOCTYPE html>
<html>
<head><title>Map Picker</title><style>body{text-align:center;font-family:sans-serif;}img{max-width:1024px;border:2px solid #ccc;cursor:crosshair;}pre{text-align:left;display:inline-block;background:#eee;padding:20px;min-width:300px;font-size:16px;}</style></head>
<body>
<h3>Click the center of the 16 Provinces exactly as they appear in the rules:</h3>
<p>Sassari, Castelsardo, Olbia, Alghero, Bosa, Macomer, Nuoro, Dorgali, Oristano, Sorgono, Lanusei, Iglesias, Sanluri, Muravera, Carbonia, Cagliari</p>
<img id="map" src="https://files.catbox.moe/1ipgnj.png" />
<br/>
<pre id="output">const PROVINCE_COORDS = {\n</pre>
<script>
let count = 1;
document.getElementById('map').addEventListener('click', (e) => {
    if(count > 16) return;
    const rect = e.target.getBoundingClientRect();
    const w = 1024; const h = 1024; // Original image size
    const x = Math.round((e.clientX - rect.left) * (w / rect.width));
    const y = Math.round((e.clientY - rect.top) * (h / rect.height));
    
    document.getElementById('output').innerText += \`  p\${count}: { x: \${x}, y: \${y} },\n\`;
    if(count === 16) document.getElementById('output').innerText += '};';
    count++;
});
</script>
</body>
</html>
`;

console.log('data:text/html;base64,' + Buffer.from(html).toString('base64'));
