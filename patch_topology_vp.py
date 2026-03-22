with open('packages/shared/src/engine/index.ts', 'r') as f:
    content = f.read()

# Setup in createNewGame
old_setup = """      adjacentHarbors: [],
      adjacentFortSpaces: [],
      hasAgricultureToken: true
    };"""

new_setup = """      adjacentHarbors: [],
      adjacentFortSpaces: [],
      hasAgricultureToken: true,
      vp1: t.vp1,
      vp2: t.vp2
    };"""

content = content.replace(old_setup, new_setup)

with open('packages/shared/src/engine/index.ts', 'w') as f:
    f.write(content)
