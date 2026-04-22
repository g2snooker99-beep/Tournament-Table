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

    for (let r = 0; r < 3; r++) {
        const matchesInRound = 8 / Math.pow(2, r);
        leftSide.appendChild(createZoneRound(r, matchesInRound, `L-Z${zoneIdx}`, zonePlayers, 0));
        rightSide.appendChild(createZoneRound(r, matchesInRound, `R-Z${zoneIdx}`, zonePlayers, 16));
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
        matchDiv.id = mKey;
        
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

// 🎯 ฟังก์ชันบันทึกที่หายไป กลับมาแล้วครับ! 🎯
window.saveAndGoToBracket = async () => {
    const saveBtn = document.getElementById('saveBtn');
    if(saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerText = "⏳ กำลังบันทึกข้อมูล...";
    }

    const playerInputs = document.querySelectorAll('.playerName');
    const players = Array.from(playerInputs).map(input => ({ name: input.value.trim() }));
    const campaignSelect = document.getElementById('campaignSelectSetup');
    const campaignId = campaignSelect ? campaignSelect.value : "manual";

    try {
        const { db, collection, addDoc, query, where, getDocs, updateDoc, doc } = window.dbFunctions;
        
        const q = query(collection(db, "tournaments"), where("campaignId", "==", campaignId));
        const snap = await getDocs(q);
        
        let docId;
        if (!snap.empty) {
            docId = snap.docs[0].id;
            await updateDoc(doc(db, "tournaments", docId), { players, updatedAt: new Date() });
        } else {
            const docRef = await addDoc(collection(db, "tournaments"), { 
                players, 
                campaignId, 
                createdAt: new Date(),
                updatedAt: new Date(),
                matches: {} 
            });
            docId = docRef.id;
        }

        const baseUrl = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
        const adminUrlEl = document.getElementById('adminUrl');
        const liveUrlEl = document.getElementById('liveUrl');
        const linkArea = document.getElementById('linkDisplayArea');
        
        if(adminUrlEl) adminUrlEl.innerText = `${baseUrl}bracket.html?id=${docId}`;
        if(liveUrlEl) liveUrlEl.innerText = `${baseUrl}live.html?id=${docId}`;
        if(linkArea) linkArea.style.display = 'block';
        
        alert("✅ บันทึกและอัปเดตสายการแข่งขันเรียบร้อย!");
    } catch (e) {
        alert("❌ บันทึกไม่สำเร็จ: " + e.message);
    } finally {
        if(saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerText = "💾 บันทึกและอัปเดตสายการแข่งขัน";
        }
    }
};

// 🎲 ฟังก์ชันสลับตำแหน่งรายชื่อในช่องกรอก
window.shuffleInputs = () => {
    const inputs = Array.from(document.querySelectorAll('.playerName'));
    const values = inputs.map(input => input.value);
    
    // สลับตำแหน่งแบบสุ่ม (Fisher-Yates)
    for (let i = values.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [values[i], values[j]] = [values[j], values[i]];
    }
    
    // ใส่ค่ากลับคืนพร้อมเอฟเฟกต์กระพริบ
    inputs.forEach((input, index) => {
        input.value = values[index];
        if(input.value.trim() !== "") {
            input.style.transition = "0.3s";
            input.style.borderColor = "var(--accent)";
            input.style.boxShadow = "0 0 10px var(--accent-glow)";
            setTimeout(() => {
                input.style.borderColor = "#333";
                input.style.boxShadow = "none";
            }, 800);
        }
    });
};
