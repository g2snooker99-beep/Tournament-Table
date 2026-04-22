window.generateInputFields = () => {
    const count = parseInt(document.getElementById('playerCount').value) || 8;
    const container = document.getElementById('nameFields');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 1; i <= count; i++) {
        const div = document.createElement('div');
        div.className = 'form-group';
        div.innerHTML = `<label style="font-size:0.8em; color:#666;">ช่องที่ ${i}</label>
                         <input type="text" class="playerName" placeholder="พิมพ์ชื่อผู้แข่ง">`;
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
    // ดึงรายชื่อเฉพาะของโซนนี้ออกมา 32 คน
    const zonePlayers = players.slice(startIdx, startIdx + playersPerZone);

    const visual = document.createElement('div');
    visual.className = 'bracket-visual';

    const leftSide = document.createElement('div');
    leftSide.className = 'side left-side';
    const rightSide = document.createElement('div');
    rightSide.className = 'side right-side';

    // แบ่ง 32 คนเป็น 16 คนฝั่งซ้าย และ 16 คนฝั่งขวา
    const sidePlayersCount = 16; 

    // วาดรอบคัดเลือก (Round 0 - 3)
    for (let r = 0; r < 3; r++) {
        const matchesInRound = 8 / Math.pow(2, r); // 8, 4, 2 แมตช์ต่อฝั่ง
        leftSide.appendChild(createZoneRound(r, matchesInRound, `L-Z${zoneIdx}`, zonePlayers.slice(0, 16)));
        rightSide.appendChild(createZoneRound(r, matchesInRound, `R-Z${zoneIdx}`, zonePlayers.slice(16, 32)));
    }

    const zoneWinnerKey = `winner-zone-${zoneIdx}`;
    const champArea = document.createElement('div');
    champArea.className = 'champion-area';
    champArea.innerHTML = `
        <div class="zone-tag">ZONE ${String.fromCharCode(65 + zoneIdx)}</div>
        <div style="color:var(--gold); font-size:1.1em; margin-bottom:10px;">ผู้ชนะประจำโซน</div>
        <div class="grand-champion-name" style="font-size:2.2em;">${window.currentMatches[zoneWinnerKey] || "รอผล"}</div>
    `;

    visual.appendChild(leftSide);
    visual.appendChild(champArea);
    visual.appendChild(rightSide);
    container.appendChild(visual);
};

function createZoneRound(r, matchCount, sidePrefix, sidePlayers) {
    const round = document.createElement('div');
    round.className = 'round';
    for (let i = 0; i < matchCount; i++) {
        const mKey = `${sidePrefix}-R${r}-M${i}`;
        const matchDiv = document.createElement('div');
        matchDiv.className = 'matchup';
        matchDiv.appendChild(createSlot(r, mKey, 0, sidePlayers));
        matchDiv.appendChild(createSlot(r, mKey, 1, sidePlayers));
        round.appendChild(matchDiv);
    }
    return round;
}

function createSlot(r, mKey, pIdx, sidePlayers) {
    const slot = document.createElement('div');
    slot.className = 'player-slot';
    let name = "รอผล";
    
    if (r === 0) {
        // รอบแรก ดึงชื่อตรงๆ จาก 16 คนของฝั่งนั้น
        const matchIdx = parseInt(mKey.split('-M')[1]);
        const playerIdxInSide = (matchIdx * 2) + pIdx;
        name = sidePlayers[playerIdxInSide]?.name || "BYE";
    } else {
        // รอบต่อมา ดึงจากผู้ชนะแมตช์ก่อนหน้า
        const parts = mKey.split('-R');
        const prevMatchIdx = parseInt(parts[1].split('-M')[1]) * 2 + pIdx;
        const prevKey = `${parts[0]}-R${r-1}-M${prevMatchIdx}`;
        name = window.currentMatches[`match-${prevKey}`] || "รอผล";
    }

    slot.innerText = name;
    if (name === "รอผล" || name === "BYE") slot.classList.add('waiting');
    
    // คลิกเลือกผู้ชนะ (เฉพาะแอดมิน)
    if (window.location.pathname.includes('bracket.html') && !slot.classList.contains('waiting')) {
        slot.onclick = () => {
            window.currentMatches[`match-${mKey}`] = name;
            // ถ้าเป็นคู่สุดท้ายของโซน ให้ส่งชื่อเข้า Champion Area
            if (mKey.includes('-R2-')) {
                const zoneIdx = mKey.split('-Z')[1].split('-')[0];
                window.currentMatches[`winner-zone-${zoneIdx}`] = name;
            }
            window.initBracket(window.currentPlayers, window.currentMatches, window.currentZoneIdx || 0);
        };
    }
    return slot;
}
