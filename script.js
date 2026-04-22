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
    const zonePlayers = players.slice(startIdx, startIdx + playersPerZone);

    const visual = document.createElement('div');
    visual.className = 'bracket-visual';

    const leftSide = document.createElement('div');
    leftSide.className = 'side left-side';
    const rightSide = document.createElement('div');
    rightSide.className = 'side right-side';

    // วาด 3 รอบในโซน (8, 4, 2 แมตช์ต่อฝั่ง)
    for (let r = 0; r < 3; r++) {
        const matchesInRound = 8 / Math.pow(2, r); // 8, 4, 2 แมตช์ต่อฝั่ง
        leftSide.appendChild(createZoneRound(r, matchesInRound, `L-Z${zoneIdx}`, zonePlayers, 0));
        rightSide.appendChild(createZoneRound(r, matchesInRound, `R-Z${zoneIdx}`, zonePlayers, 16)); // 🎉 แก้จุดนี้: ใส่ Offset 16 ให้ฝั่งขวา 🎉
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

function createZoneRound(r, matchCount, sidePrefix, zonePlayers, sideOffset) {
    const round = document.createElement('div');
    round.className = 'round';
    for (let i = 0; i < matchCount; i++) {
        const mKey = `${sidePrefix}-R${r}-M${i}`;
        const matchDiv = document.createElement('div');
        matchDiv.className = 'matchup';
        matchDiv.id = mKey; // ใส่ ID เพื่อใช้ค้นหาตอนคลิกเลือกแชมป์โซน
        
        // ส่ง sideOffset ไปให้ createSlot คำนวณตำแหน่งช่องรอบแรกให้ถูกต้อง
        matchDiv.appendChild(createSlot(r, mKey, 0, zonePlayers, sideOffset));
        matchDiv.appendChild(createSlot(r, mKey, 1, zonePlayers, sideOffset));
        round.appendChild(matchDiv);
    }
    return round;
}

function createSlot(r, mKey, pIdx, zonePlayers, sideOffset) {
    const slot = document.createElement('div');
    slot.className = 'player-slot';
    let name = "รอผล";
    
    if (r === 0) {
        // รอบแรก ดึงชื่อตรงๆ จาก 32 คนของโซน
        const matchIdx = parseInt(mKey.split('-M')[1]);
        const playerIdxInSide = (matchIdx * 2) + pIdx;
        const playerIdxInZone = sideOffset + playerIdxInSide; // 🎉 แก้จุดนี้: คำนวณ Index รอบแรกให้ถูกต้อง 🎉
        name = zonePlayers[playerIdxInZone]?.name || "BYE";
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
            // ถ้าเป็นแมตช์ชิงแชมป์โซน (Round 2) ให้ส่งชื่อเข้า Champion Area
            if (r === 2) {
                const zoneIdx = mKey.split('-Z')[1].split('-')[0];
                window.currentMatches[`winner-zone-${zoneIdx}`] = name;
            }
            // วาดตารางใหม่เพื่ออัปเดตสาย
            window.initBracket(window.currentPlayers, window.currentMatches, window.currentZoneIdx || 0);
        };
    }
    return slot;
}
