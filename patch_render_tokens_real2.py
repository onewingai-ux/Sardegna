import re

with open('apps/frontend/src/App.tsx', 'r') as f:
    content = f.read()

# Render tokens on the map
old_prov = """              return (
                <g key={province.id} transform={`translate(${p.x}, ${p.y})`} onClick={() => handleMapClick(province.id, 'province')} style={{cursor: selectedCardId ? 'crosshair' : 'default'}}>
                  {/* We only draw the pieces directly over the map coordinate */}
                  {/* Center the pieces grid relative to the coordinate */}
                  <circle cx="0" cy="0" r="25" fill="transparent" />
                  <g transform="translate(0, 0)">"""

new_prov = """              return (
                <g key={province.id} transform={`translate(${p.x}, ${p.y})`} onClick={() => handleMapClick(province.id, 'province')} style={{cursor: selectedCardId ? 'crosshair' : 'default'}}>
                  {/* We only draw the pieces directly over the map coordinate */}
                  {/* Center the pieces grid relative to the coordinate */}
                  <circle cx="0" cy="0" r="25" fill="transparent" />
                  
                  {/* Provide a fallback in case state.hasAgricultureToken isn't present in old games */}
                  {(province.hasAgricultureToken || province.hasAgricultureToken === undefined) && (
                    <g transform="translate(0, -20)">
                      <circle cx="0" cy="0" r="8" fill={province.resource === 'wheat' ? '#fde047' : province.resource === 'wine_olive' ? '#86efac' : '#fdba74'} stroke="black" strokeWidth="1" />
                    </g>
                  )}
                  
                  <g transform="translate(0, 0)">"""

content = content.replace(old_prov, new_prov)

with open('apps/frontend/src/App.tsx', 'w') as f:
    f.write(content)
