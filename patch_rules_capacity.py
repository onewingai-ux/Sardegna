with open('packages/shared/src/engine/index.ts', 'r') as f:
    content = f.read()

old_logic = """    if (action.payload && action.payload.targetId) {
      const { targetId, targetType } = action.payload;
      
      if (targetType === 'province' && state.provinces[targetId]) {
         const typeMap: Record<string, 'villager' | 'village' | 'priest'> = {
           'place_villager': 'villager',
           'place_village': 'village',
           'move_priest': 'priest'
         };
         const pieceType = typeMap[card.effectType] || 'villager';
         
         state.provinces[targetId].pieces.push({
           playerId: player.id,
           type: pieceType
         });
         state.log.push(`${player.name} placed a ${pieceType} in ${state.provinces[targetId].name}`);
      } else if (targetType === 'fortSpace' && state.fortSpaces[targetId] && card.effectType === 'place_fort') {
         state.fortSpaces[targetId].forts.push({
           playerId: player.id
         });
         state.log.push(`${player.name} placed a fort at ${targetId}`);
      }
    } else {"""

new_logic = """    if (action.payload && action.payload.targetId) {
      const { targetId, targetType } = action.payload;
      
      if (targetType === 'province' && state.provinces[targetId]) {
         const typeMap: Record<string, 'villager' | 'village' | 'priest'> = {
           'place_villager': 'villager',
           'place_village': 'village',
           'move_priest': 'priest'
         };
         const pieceType = typeMap[card.effectType] || 'villager';
         const reserveKey = pieceType === 'villager' ? 'villagers' : pieceType === 'village' ? 'villages' : 'priests';

         if (state.provinces[targetId].pieces.length >= 7) {
             throw new Error(`Province ${state.provinces[targetId].name} is full (max 7 pieces)`);
         }
         
         if (player.reserves[reserveKey] <= 0) {
             throw new Error(`No ${reserveKey} left in your personal reserve`);
         }
         
         player.reserves[reserveKey]--;
         state.provinces[targetId].pieces.push({
           playerId: player.id,
           type: pieceType
         });
         state.log.push(`${player.name} placed a ${pieceType} in ${state.provinces[targetId].name}`);
      } else if (targetType === 'fortSpace' && state.fortSpaces[targetId] && card.effectType === 'place_fort') {
         if (state.fortSpaces[targetId].forts.length > 0) {
             throw new Error(`Fort space ${targetId} is already occupied`);
         }
         if (player.reserves.forts <= 0) {
             throw new Error(`No forts left in your personal reserve`);
         }
         player.reserves.forts--;
         state.fortSpaces[targetId].forts.push({
           playerId: player.id
         });
         state.log.push(`${player.name} placed a fort at ${targetId}`);
      }
    } else {"""

content = content.replace(old_logic, new_logic)

with open('packages/shared/src/engine/index.ts', 'w') as f:
    f.write(content)
