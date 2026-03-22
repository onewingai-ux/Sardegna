with open('packages/shared/src/engine/index.ts', 'r') as f:
    content = f.read()

old_logic = """    if (tiedForFirst.length > 1) {
      // Tie for 1st
      tiedForFirst.forEach(p => {
        p.score += 2;
        state.log.push(`Province ${province.name}: ${p.name} tied for 1st (${highestInfluence} inf) -> +2 VP`);
      });
    } else {
      // Clear 1st
      const first = tiedForFirst[0];
      first.score += 4;
      state.log.push(`Province ${province.name}: ${first.name} is 1st (${highestInfluence} inf) -> +4 VP`);
      
      // Look for 2nd
      if (sorted.length > 1) {
        const secondInfluence = influence[sorted[1].id];
        const tiedForSecond = sorted.filter(p => influence[p.id] === secondInfluence);
        
        if (tiedForSecond.length === 1) {
           const second = tiedForSecond[0];
           let getsVP = true;
           // 2-player exception
           if (state.players.length === 2 && secondInfluence < Math.ceil(highestInfluence / 2)) {
               getsVP = false;
               state.log.push(`Province ${province.name}: ${second.name} is 2nd but lacks half of 1st's influence -> +0 VP`);
           }
           if (getsVP) {
               second.score += 2;
               state.log.push(`Province ${province.name}: ${second.name} is 2nd (${secondInfluence} inf) -> +2 VP`);
           }
        } else {
           state.log.push(`Province ${province.name}: Multiple tied for 2nd -> +0 VP`);
        }
      }
    }"""

new_logic = """    if (tiedForFirst.length > 1) {
      // Tie for 1st
      tiedForFirst.forEach(p => {
        p.score += province.vp2;
        state.log.push(`Province ${province.name}: ${p.name} tied for 1st (${highestInfluence} inf) -> +${province.vp2} VP`);
      });
    } else {
      // Clear 1st
      const first = tiedForFirst[0];
      first.score += province.vp1;
      state.log.push(`Province ${province.name}: ${first.name} is 1st (${highestInfluence} inf) -> +${province.vp1} VP`);
      
      // Look for 2nd
      if (sorted.length > 1) {
        const secondInfluence = influence[sorted[1].id];
        const tiedForSecond = sorted.filter(p => influence[p.id] === secondInfluence);
        
        if (tiedForSecond.length === 1) {
           const second = tiedForSecond[0];
           let getsVP = true;
           // 2-player exception
           if (state.players.length === 2 && secondInfluence < Math.ceil(highestInfluence / 2)) {
               getsVP = false;
               state.log.push(`Province ${province.name}: ${second.name} is 2nd but lacks half of 1st's influence -> +0 VP`);
           }
           if (getsVP) {
               second.score += province.vp2;
               state.log.push(`Province ${province.name}: ${second.name} is 2nd (${secondInfluence} inf) -> +${province.vp2} VP`);
           }
        } else {
           state.log.push(`Province ${province.name}: Multiple tied for 2nd -> +0 VP`);
        }
      }
    }"""

content = content.replace(old_logic, new_logic)

with open('packages/shared/src/engine/index.ts', 'w') as f:
    f.write(content)
