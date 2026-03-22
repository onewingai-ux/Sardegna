with open('packages/shared/src/engine/index.ts', 'r') as f:
    content = f.read()

content = content.replace("import { GameState, Player, PlayerId, CharacterCard, Province, GamePhase, FortCard } from '../types';", 
                          "import { GameState, Player, PlayerId, CharacterCard, Province, GamePhase, FortCard, FortSpace } from '../types';")

with open('packages/shared/src/engine/index.ts', 'w') as f:
    f.write(content)
