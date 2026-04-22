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

    const visual = document.createElement('div');
    visual.className = 'bracket-visual';

    // 🚩 โหมดรอบชิงชนะเลิศ (ดึงแชมป์โซนมาชิงกัน)
    if (zoneIdx === 99) {
        visual.innerHTML = `
            <div class="side left-side">
                <div class="round">
                    <div class="matchup" id="final-sf-1">
                        ${createFinalSlot(0, "A")}
                        ${createFinalSlot(1, "B")}
                    </div>
                </div>
            </div>
            <div class="champion-area">
                <div class="zone-tag" style="background:var(--gold)">GRAND FINAL</div>
                <div style="color:var(--gold); font-size:1.2em; margin-bottom:10px;">🏆 THE CHAMPION 🏆</div>
                <div class="grand-champion-name" style="font-size:3em;">${window.currentMatches['grand-champion'] || "???"}</div>
                <div class="matchup" style="margin-top:20px; border-color:var(--gold);">
                    ${createFinalWinnerSlot("sf-1", "sf-2")}
                </div>
            </div>
            <div class="side right-side">
                <div class="round">
                    <div class="matchup" id="final-sf-2">
                        ${createFinalSlot(2, "C")}
                        ${createFinalSlot(3, "D")}
                    </div>
                </div>
            </div>
        `;
    } else {
        // 🧩 โหมดแบ่งโซนปกติ (32 คน)
        const playersPerZone = 32;
        const startIdx = zoneIdx * playersPerZone;
        const zonePlayers = players.slice(startIdx, startIdx + playersPerZone);

        const leftSide = document.createElement('div');
        leftSide.className = 'side left-side';
        const rightSide = document.createElement('div');
        rightSide.className = 'side right-side';

        for (let r = 0; r < 3; r++) {
            const matchCount = 8 / Math.pow(2, r);
            leftSide.appendChild(createZoneRound(r, matchCount, `L-Z${zoneIdx}`, zonePlayers, 0));
            rightSide.appendChild(createZoneRound(r, matchCount, `R-Z${zoneIdx}`, zonePlayers, 16));
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
    }

    container.appendChild(visual);
};

// ฟังก์ชันสร้างช่องรอบชิง (ดึงจากแชมป์โซน)
function createFinalSlot(idx, zoneLetter) {
    const name = window.currentMatches[`winner-zone-${idx}`] || `รอแชมป์โซน ${zoneLetter}`;
    const slot = document.createElement('div');
    slot.className = `player-slot ${!window.currentMatches[`winner-zone-${idx}`] ? 'waiting' : ''}`;
    slot.innerText = name;
    if (window.location.pathname.includes('bracket.html') && name.indexOf('รอ') === -1) {
        slot.onclick = () => {
            window.currentMatches[`winner-sf-${idx < 2 ? 1 : 2}`] = name;
            window.initBracket(window.currentPlayers, window.currentMatches, 99);
        };
    }
    return slot.outerHTML;
}

function createFinalWinnerSlot(id1, id2) {
    const slot1 = window.currentMatches[`winner-${id1}`];
    const slot2 = window.currentMatches[`winner-${id2}`];
    // สร้าง UI สำหรับให้แอดมินเลือกแชมป์โลก
    return `
        <div class="player-slot ${!slot1 ? 'waiting' : ''}" onclick="selectGrandChamp('${slot1}')">${slot1 || "รอคู่ชิง 1"}</div>
        <div class="player-slot ${!slot2 ? 'waiting' : ''}" onclick="selectGrandChamp('${slot2}')">${slot2 || "รอคู่ชิง 2"}</div>
    `;
}

window.selectGrandChamp = (name) => {
    if (!name || name.indexOf('รอ') !== -1) return;
    window.currentMatches['grand-champion'] = name;
    window.initBracket(window.currentPlayers, window.currentMatches, 99);
};

function createZoneRound(r, matchCount, sidePrefix, zonePlayers, sideOffset) {
    const round = document.createElement('div');
    round.className = 'round';
    for (let i = 0; i < matchCount; i++) {
        const mKey = `${sidePrefix}-R${r}-M${i}`;
        const matchDiv = document.createElement('div');
        matchDiv.className = 'matchup';
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
        const matchIdx = parseInt(mKey.split('-M')[1]);
        const playerIdxInSide = (matchIdx * 2) + pIdx;
        const playerIdxInZone = sideOffset + playerIdxInSide;
        name = zonePlayers[playerIdxInZone]?.name || "BYE";
    } else {
        const parts = mKey.split('-R');
        const prevMatchIdx = parseInt(parts[1].split('-M')[1]) * 2 + pIdx;
        const prevKey = `${parts[0]}-R${r-1}-M${prevMatchIdx}`;
        name = window.currentMatches[`match-${prevKey}`] || "รอผล";
    }
    slot.innerText = name;
    if (name === "รอผล" || name === "BYE") slot.classList.add('waiting');
    if (window.location.pathname.includes('bracket.html') && !slot.classList.contains('waiting')) {
        slot.onclick = () => {
            window.currentMatches[`match-${mKey}`] = name;
            if (r === 2) {
                const zoneIdx = mKey.split('-Z')[1].split('-')[0];
                window.currentMatches[`winner-zone-${zoneIdx}`] = name;
            }
            window.initBracket(window.currentPlayers, window.currentMatches, window.currentZoneIdx || 0);
        };
    }
    return slot;
}

window.saveAndGoToBracket = async () => {
    const saveBtn = document.getElementById('saveBtn');
    if(saveBtn) { saveBtn.disabled = true; saveBtn.innerText = "⏳ กำลังบันทึก..."; }
    const players = Array.from(document.querySelectorAll('.playerName')).map(input => ({ name: input.value.trim() }));
    const campaignId = document.getElementById('campaignSelectSetup')?.value || "manual";
    try {
        const { db, collection, addDoc, query, where, getDocs, updateDoc, doc } = window.dbFunctions;
        const q = query(collection(db, "tournaments"), where("campaignId", "==", campaignId));
        const snap = await getDocs(q);
        let docId;
        if (!snap.empty) {
            docId = snap.docs[0].id;
            await updateDoc(doc(db, "tournaments", docId), { players, updatedAt: new Date() });
        } else {
            const docRef = await addDoc(collection(db, "tournaments"), { players, campaignId, createdAt: new Date(), updatedAt: new Date(), matches: {} });
            docId = docRef.id;
        }
        const baseUrl = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
        if(document.getElementById('adminUrl')) document.getElementById('adminUrl').innerText = `${baseUrl}bracket.html?id=${docId}`;
        if(document.getElementById('liveUrl')) document.getElementById('liveUrl').innerText = `${baseUrl}live.html?id=${docId}`;
        if(document.getElementById('linkDisplayArea')) document.getElementById('linkDisplayArea').style.display = 'block';
        alert("✅ บันทึกเรียบร้อย!");
    } catch (e) { alert("❌ " + e.message); }
    if(saveBtn) { saveBtn.disabled = false; saveBtn.innerText = "💾 บันทึกและอัปเดตสายการแข่งขัน"; }
};
