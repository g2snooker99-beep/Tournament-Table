window.generateInputFields = () => {
    const count = parseInt(document.getElementById('playerCount').value) || 8;
    const container = document.getElementById('nameFields');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 1; i <= count; i++) {
        const div = document.createElement('div');
        div.innerHTML = `<label style="font-size:0.8em; color:#666;">ช่องที่ ${i}</label>
                         <input type="text" class="playerName" placeholder="ระบุชื่อ">`;
        container.appendChild(div);
    }
    document.getElementById('playerInputs').style.display = 'block';
};

window.initBracket = (players, matches = {}, zoneIdx = 0) => {
    window.currentMatches = matches;
    const container = document.getElementById('bracket');
    if (!container) return;
    container.innerHTML = '';

    const playersPerZone = 32;
    const startIdx = zoneIdx * playersPerZone;
    const zonePlayers = players.slice(startIdx, startIdx + playersPerZone);
    
    // ถ้าข้อมูลไม่พอในโซนนั้น ให้ Bypass
    if (zonePlayers.length === 0 && zoneIdx > 0) return;

    const visual = document.createElement('div');
    visual.className = 'bracket-visual';

    const leftSide = document.createElement('div');
    leftSide.className = 'side left-side';
    const rightSide = document.createElement('div');
    rightSide.className = 'side right-side';

    // วาด 4 รอบในโซน (32 คน)
    for (let r = 0; r < 3; r++) {
        const matchCount = 16 / Math.pow(2, r + 1);
        leftSide.appendChild(createZoneRound(r, matchCount, `L${zoneIdx}`, zonePlayers));
        rightSide.appendChild(createZoneRound(r, matchCount, `R${zoneIdx}`, zonePlayers));
    }

    const zoneWinnerKey = `match-3-zone${zoneIdx}`;
    const champArea = document.createElement('div');
    champArea.className = 'champion-area';
    champArea.innerHTML = `
        <div class="zone-tag">ZONE ${String.fromCharCode(65 + zoneIdx)}</div>
        <div style="color:var(--gold); font-size:1.2em;">ผู้ชนะประจำโซน</div>
        <div class="grand-champion-name">${window.currentMatches[zoneWinnerKey] || "รอผล"}</div>
    `;

    visual.appendChild(leftSide);
    visual.appendChild(champArea);
    visual.appendChild(rightSide);
    container.appendChild(visual);
};

function createZoneRound(r, count, prefix, players) {
    const round = document.createElement('div');
    round.className = 'round';
    for (let i = 0; i < count; i++) {
        const mKey = `${prefix}-${r}-${i}`;
        const match = document.createElement('div');
        match.className = 'matchup';
        match.appendChild(createSlot(r, mKey, 0, players));
        match.appendChild(createSlot(r, mKey, 1, players));
        round.appendChild(match);
    }
    return round;
}

function createSlot(r, mKey, pIdx, players) {
    const slot = document.createElement('div');
    slot.className = 'player-slot';
    let name = "รอผล";
    
    if (r === 0) {
        const side = mKey.split('-')[0]; // L0 or R0
        const matchIdx = parseInt(mKey.split('-')[2]);
        const offset = side.startsWith('R') ? 16 : 0;
        const finalIdx = offset + (matchIdx * 2) + pIdx;
        name = players[finalIdx]?.name || "BYE";
    } else {
        const parts = mKey.split('-');
        const prevKey = `${parts[0]}-${r-1}-${parseInt(parts[2])*2 + pIdx}`;
        name = window.currentMatches[`match-${r-1}-${prevKey}`] || "รอผล";
    }

    slot.innerText = name;
    if (name === "รอผล" || name === "BYE") slot.classList.add('waiting');
    
    if (window.location.pathname.includes('bracket.html') && !slot.classList.contains('waiting')) {
        slot.onclick = () => {
            window.currentMatches[`match-${r}-${mKey}`] = name;
            window.initBracket(window.currentPlayers, window.currentMatches, window.currentZoneIdx || 0);
        };
    }
    return slot;
}

// ... ส่วนบันทึกข้อมูลคงเดิม ...
window.saveAndGoToBracket = async () => { /* ...เดิม... */ };
