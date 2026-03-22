import re

with open('packages/shared/src/engine/index.ts', 'r') as f:
    content = f.read()

fort_connections = """const FORT_CONNECTIONS: Record<string, string[]> = {
  f1: ['p1', 'p2'],
  f2: ['p2', 'p3'],
  f3: ['p2', 'p3', 'p5'],
  f4: ['p3', 'p5'],
  f5: ['p1', 'p4'],
  f6: ['p1', 'p2', 'p4'],
  f7: ['p4', 'p2', 'p6', 'p7'],
  f8: ['p2', 'p5', 'p7'],
  f9: ['p5', 'p7', 'p8'],
  f10: ['p5', 'p7', 'p8'],
  f11: ['p4', 'p6'],
  f12: ['p6', 'p7', 'p9', 'p10'],
  f13: ['p7', 'p8', 'p10'],
  f14: ['p8', 'p10'],
  f15: ['p6', 'p9'],
  f16: ['p9', 'p10', 'p12', 'p13'],
  f17: ['p10', 'p13'],
  f18: ['p9', 'p11'],
  f19: ['p9', 'p11', 'p12'],
  f20: ['p12', 'p13', 'p16'],
  f21: ['p13', 'p16'],
  f22: ['p11', 'p14'],
  f23: ['p14', 'p11', 'p15'],
  f24: ['p11', 'p12', 'p15'],
  f25: ['p16', 'p12', 'p15'],
  f26: ['p14', 'p15'],
};
"""

# Find where to inject. We can put it right after ISLAND_TOPOLOGY
topo_end = content.find("];\n", content.find("const ISLAND_TOPOLOGY")) + 3
content = content[:topo_end] + "\n" + fort_connections + "\n" + content[topo_end:]

# Now, update createNewGame to populate fortSpaces and adjacentFortSpaces
setup_provinces = """  ISLAND_TOPOLOGY.forEach(t => {
    provinces[t.id] = {
      id: t.id,
      name: t.name,
      resource: t.resource as any,
      pieces: [],
      adjacentProvinces: t.adj,
      adjacentHarbors: [],
      adjacentFortSpaces: []
    };
  });"""

new_setup_provinces = """  ISLAND_TOPOLOGY.forEach(t => {
    provinces[t.id] = {
      id: t.id,
      name: t.name,
      resource: t.resource as any,
      pieces: [],
      adjacentProvinces: t.adj,
      adjacentHarbors: [],
      adjacentFortSpaces: []
    };
  });

  const fortSpaces: Record<string, FortSpace> = {};
  for (const [fId, pIds] of Object.entries(FORT_CONNECTIONS)) {
    fortSpaces[fId] = {
      id: fId,
      forts: [],
      adjacentProvinces: pIds
    };
    pIds.forEach(pId => {
      if(provinces[pId]) {
        provinces[pId].adjacentFortSpaces.push(fId);
      }
    });
  }
"""
content = content.replace(setup_provinces, new_setup_provinces)

# Fix the return block of createNewGame since it has `fortSpaces: {}` hardcoded
content = content.replace("fortSpaces: {},", "fortSpaces,")

with open('packages/shared/src/engine/index.ts', 'w') as f:
    f.write(content)

