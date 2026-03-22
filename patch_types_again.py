with open('packages/shared/src/types/index.ts', 'r') as f:
    content = f.read()

content = content.replace("export type GamePhase = 'lobby' | 'setup' | 'playing' | 'scoring' | 'finished';", "export type GamePhase = 'lobby' | 'setup' | 'playing' | 'scoring' | 'sentinel_reveal' | 'finished';")

with open('packages/shared/src/types/index.ts', 'w') as f:
    f.write(content)

with open('packages/shared/src/engine/index.ts', 'r') as f:
    content = f.read()
    
# my patch earlier changed 'end' to 'sentinel_reveal', but actually it seems the type had 'setup' and 'finished' not 'end'.
content = content.replace("state.phase = 'end';", "state.phase = 'finished';")
with open('packages/shared/src/engine/index.ts', 'w') as f:
    f.write(content)

