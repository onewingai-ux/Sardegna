import re

with open('packages/shared/src/types/index.ts', 'r') as f:
    content = f.read()

old_prov = """  adjacentProvinces: string[]; // IDs of adjacent provinces
  adjacentHarbors: string[]; // IDs of adjacent harbors
  adjacentFortSpaces: string[]; // IDs of fort spaces bordering this province
  hasAgricultureToken: boolean;
}"""

new_prov = """  adjacentProvinces: string[]; // IDs of adjacent provinces
  adjacentHarbors: string[]; // IDs of adjacent harbors
  adjacentFortSpaces: string[]; // IDs of fort spaces bordering this province
  hasAgricultureToken: boolean;
  vp1: number;
  vp2: number;
}"""

content = content.replace(old_prov, new_prov)

with open('packages/shared/src/types/index.ts', 'w') as f:
    f.write(content)
