with open('apps/backend/src/index.ts', 'r') as f:
    content = f.read()

# Replace the type error (the type of 'phase' was likely inferred from somewhere else that didn't know about sentinel_reveal)
# Wait, the compiler says 'phase' in currentGameState cannot be 'sentinel_reveal' because of `if (currentGameState.phase !== 'playing') return;` earlier!
# Let's check!
content = content.replace("if (!currentGameState || currentGameState.phase !== 'playing') return;", "if (!currentGameState) return;\n    if (currentGameState.phase !== 'playing' && currentGameState.phase !== 'sentinel_reveal') return;")

with open('apps/backend/src/index.ts', 'w') as f:
    f.write(content)

with open('apps/frontend/src/App.tsx', 'r') as f:
    front_content = f.read()
    
# React unused variable
front_content = front_content.replace(
    "const handleSentinelReveal = (numCards: number) => {",
    "export const handleSentinelReveal = (numCards: number) => {"
)
# Wait, handleSentinelReveal IS used in the render block!
