import re

with open('packages/shared/src/engine/index.ts', 'r') as f:
    content = f.read()

old_deck_logic = """  // Setup logic: shuffle deck, deal 11 to row, face up 2, etc.
  for (let i = 0; i < 11; i++) {
    state.fortCardRow.push({
      id: `fc${i + 1}`,
      scoringProvinceIds: [ISLAND_TOPOLOGY[i % 16].id, ISLAND_TOPOLOGY[(i+1) % 16].id]
    });
  }"""

new_deck_logic = """  // Create 26 fort cards corresponding to the 26 forts
  const allFortCards: FortCard[] = Object.entries(FORT_CONNECTIONS).map(([fId, pIds]) => ({
    id: fId,
    scoringProvinceIds: [...pIds]
  }));

  // Shuffle the deck (simple Fisher-Yates for MVP)
  for (let i = allFortCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allFortCards[i], allFortCards[j]] = [allFortCards[j], allFortCards[i]];
  }

  // Deal 11 to the row, rest to deck
  state.fortCardRow = allFortCards.slice(0, 11);
  state.fortCardDeck = allFortCards.slice(11);
  state.faceUpFortCards = 2;"""

content = content.replace(old_deck_logic, new_deck_logic)

with open('packages/shared/src/engine/index.ts', 'w') as f:
    f.write(content)
