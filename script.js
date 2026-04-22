window.generateInputFields = () => {
    const count = parseInt(document.getElementById('playerCount').value) || 8;
    const container = document.getElementById('nameFields');
    if (!container) return;
    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:15px; align-items:center; background:rgba(0,0,0,0.3); padding:10px; border-radius:10px; border:1px dashed #555;">
            <div style="display:flex; gap:10px;">
                <button onclick="fillTestData()" style="background:linear-gradient(135deg, #f39c12 0%, #d68910 100%); color:#000; padding:8px 20px; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">🤖 เติมชื่อทดสอบ</button>
                <button onclick="bulkPaste()" style="background:var(--status-success); color:white; padding:8px 20px; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">📋 วางรายชื่อ</button>
            </div>
        </div>
        <div id="tabsArea" class="setup-tabs"></div>
        <div id="zonesArea"></div>
    `;
    const playersPerZone = 32;
    const totalZones = Math.ceil(count / playersPerZone);
    for(let z = 0; z < totalZones; z++) {
        const tab = document.createElement('div'); tab.className = `setup-tab ${z === 0 ? 'active' : ''}`; tab.innerText = `ZONE ${String.fromCharCode(65 + z)}`;
        tab.onclick = () => {
            document.querySelectorAll('.setup-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.zone-container').forEach(c => c.classList.remove('active'));
            tab.classList.add('active'); document.getElementById(`zone-inputs-${z}`).classList.add('active');
        };
        document.getElementById('tabsArea').appendChild(tab);
        const zoneContainer = document.createElement('div'); zoneContainer.id = `zone-inputs-${z}`; zoneContainer.className = `zone-container ${z === 0 ? 'active' : ''}`;
        const grid = document.createElement('div'); grid.className = 'name-grid';
        for (let i = (z * 32) + 1; i <= Math.min((z + 1) * 32, count); i++) {
            grid.innerHTML += `<div class="form-group"><label style="font-size:0.7em; color:#888;">${i}</label><input type="text" class="playerName" placeholder="ผู้แข่ง"></div>`;
        }
        zoneContainer.appendChild(grid); document.getElementById('zonesArea').appendChild(zoneContainer);
    }
    document.getElementById('playerInputs').style.display = 'block';
};

window.fillTestData = () => {
    const inputs = document.querySelectorAll('.playerName');
    if(inputs.length === 0) return;
    inputs.forEach((input, index) => {
        input.value = `P-${index + 1}`;
        input.style.borderColor = "var(--gold)";
        setTimeout(() => { input.style.borderColor = "transparent"; }, 800);
    });
};

window.bulkPaste = () => {
    const text = prompt("วางรายชื่อที่นี่ (1 ชื่อต่อ 1 บรรทัด):");
    if(!text) return;
    const names = text.split('\n').map(n => n.trim()).filter(n => n !== "");
    const inputs = document.querySelectorAll('.playerName');
    names.forEach((name, i) => { if(inputs[i]) inputs[i].value = name; });
};

window.shuffleInputs = () => {
    const inputs = Array.from(document.querySelectorAll('.playerName'));
    const vals = inputs.map(i => i.value);
    for (let i = vals.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [vals[i], vals[j]] = [vals[j], vals[i]]; }
    inputs.forEach((input, i) => { input.value = vals[i]; });
};

window.isAdmin = () => window.location.pathname.includes('bracket.html');

window.initBracket = (players, matches = {}, zoneIdx = 0) => {
    window.currentMatches = matches; window.currentPlayers = players;
    const container = document.getElementById('bracket'); if (!container) return; container.innerHTML = '';
    const visual = document.createElement('div'); visual.className = 'bracket-visual';

    if (zoneIdx === 99) {
        visual.innerHTML = `
            <div class="side left-side"><div class="round"><div class="matchup">${createFinalSlot(0,"A")}${createFinalSlot(1,"B")}</div></div></div>
            <div class="champion-area">
                <div class="zone-tag" style="background:var(--gold)">GRAND FINAL</div>
                <div style="color:var(--gold); font-size:1.2em; margin-bottom:10px;">🏆 THE CHAMPION 🏆</div>
                <div class="grand-champion-name" style="font-size:3em; display:flex; align-items:center; justify-content:center;">
                    <span class="slot-name">${window.currentMatches['grand-champion'] || "???"}</span>
                    ${isAdmin() && window.currentMatches['grand-champion'] ? `<span class="delete-btn" onclick="if(confirm('ยกเลิกแชมป์รายการใช่หรือไม่?')){ delete window.currentMatches['grand-champion']; window.initBracket(window.currentPlayers, window.currentMatches, 99); }">✖</span>` : ''}
                </div>
                <div class="matchup" style="margin-top:20px; border-color:var(--gold);">${createFinalWinnerSlot("sf-1","sf-2")}</div>
            </div>
            <div class="side right-side"><div class="round"><div class="matchup">${createFinalSlot(2,"C")}${createFinalSlot(3,"D")}</div></div></div>
        `;
    } else {
        const startIdx = zoneIdx * 32; const zonePlayers = players.slice(startIdx, startIdx + 32);
        const leftSide = document.createElement('div'); leftSide.className = 'side left-side';
        const rightSide = document.createElement('div'); rightSide.className = 'side right-side';
        for (let r = 0; r < 4; r++) {
            leftSide.appendChild(createZoneRound(r, 8/Math.pow(2,r), `L-Z${zoneIdx}`, zonePlayers, 0));
            rightSide.appendChild(createZoneRound(r, 8/Math.pow(2,r), `R-Z${zoneIdx}`, zonePlayers, 16));
        }
        const winKey = `winner-zone-${zoneIdx}`; const LFinal = `match-L-Z${zoneIdx}-R3-M0`; const RFinal = `match-R-Z${zoneIdx}-R3-M0`;
        const champArea = document.createElement('div'); champArea.className = 'champion-area';
        champArea.innerHTML = `
            <div class="zone-tag">ZONE ${String.fromCharCode(65+zoneIdx)}</div>
            <div style="color:var(--gold); font-size:1.1em; margin-bottom:10px;">🏆 ผู้ชนะประจำโซน 🏆</div>
            <div class="grand-champion-name" style="font-size:2.2em; display:flex; align-items:center; justify-content:center;">
                <span class="slot-name">${window.currentMatches[winKey] || "รอผล"}</span>
                ${isAdmin() && window.currentMatches[winKey] ? `<span class="delete-btn" onclick="if(confirm('ยกเลิกแชมป์โซนนี้ใช่หรือไม่?')){ delete window.currentMatches['${winKey}']; window.initBracket(window.currentPlayers, window.currentMatches, window.currentZoneIdx); }">✖</span>` : ''}
            </div>
            <div style="margin-top:30px; font-size:0.9em; color:#888;">แมตช์ชิงแชมป์โซน</div>
            <div class="matchup" style="margin-top:10px; border-color:var(--accent);">
                <div class="player-slot ${!window.currentMatches[LFinal]?'waiting':''}" onclick="if(isAdmin()) selectZoneChamp('${zoneIdx}','${window.currentMatches[LFinal]}')">
                    <span class="slot-name">${window.currentMatches[LFinal]||"รอแชมป์ซ้าย"}</span>
                </div>
                <div class="player-slot ${!window.currentMatches[RFinal]?'waiting':''}" onclick="if(isAdmin()) selectZoneChamp('${zoneIdx}','${window.currentMatches[RFinal]}')">
                    <span class="slot-name">${window.currentMatches[RFinal]||"รอแชมป์ขวา"}</span>
                </div>
            </div>`;
        visual.appendChild(leftSide); visual.appendChild(champArea); visual.appendChild(rightSide);
    }
    container.appendChild(visual);
};

function createZoneRound(r, count, prefix, players, offset) {
    const round = document.createElement('div'); round.className = 'round';
    for (let i = 0; i < count; i++) {
        const mKey = `${prefix}-R${r}-M${i}`; const match = document.createElement('div'); match.className = 'matchup';
        match.appendChild(createSlot(r, mKey, 0, players, offset)); match.appendChild(createSlot(r, mKey, 1, players, offset));
        round.appendChild(match);
    }
    return round;
}

function createSlot(r, mKey, pIdx, players, offset) {
    const slot = document.createElement('div'); slot.className = 'player-slot';
    let name = "รอผล";
    let prevKeyToClear = null; // 🔑 ตัวแปรใหม่สำหรับดึง Key ของรอบที่แล้วมาลบ
    
    if (r === 0) {
        const mIdx = parseInt(mKey.split('-M')[1]); name = players[offset + (mIdx * 2) + pIdx]?.name || "BYE";
    } else {
        const parts = mKey.split('-R'); 
        const prevMatchIdx = parseInt(parts[1].split('-M')[1]) * 2 + pIdx;
        prevKeyToClear = `${parts[0]}-R${r-1}-M${prevMatchIdx}`;
        name = window.currentMatches[`match-${prevKeyToClear}`] || "รอผล";
    }
    const isWaiting = name === "รอผล" || name === "BYE";
    if (isWaiting) slot.classList.add('waiting');

    slot.innerHTML = `<span class="slot-name">${name}</span>`;

    if (isAdmin() && !isWaiting) {
        const delBtn = document.createElement('span'); delBtn.className = 'delete-btn'; delBtn.innerHTML = '✖'; delBtn.title = "ลบชื่อ / ยกเลิกผล";
        delBtn.onclick = (e) => {
            e.stopPropagation();
            if(confirm(`ต้องการยกเลิกผลของ "${name}" ใช่หรือไม่?`)) {
                if (r === 0) {
                    // ถ้ารอบแรก ลบที่ players array ตรงๆ
                    const mIdx = parseInt(mKey.split('-M')[1]);
                    window.currentPlayers[(window.currentZoneIdx * 32) + offset + (mIdx * 2) + pIdx] = { name: "BYE" };
                } else {
                    // 💥 ถ้ารอบ 2 ขึ้นไป ให้ลบจาก Key ของ "รอบก่อนหน้า" 💥
                    delete window.currentMatches[`match-${prevKeyToClear}`];
                }
                window.initBracket(window.currentPlayers, window.currentMatches, window.currentZoneIdx || 0);
            }
        };
        slot.appendChild(delBtn);
    }

    if (isAdmin()) {
        slot.onclick = () => {
            if (isWaiting) return; window.currentMatches[`match-${mKey}`] = name;
            window.initBracket(window.currentPlayers, window.currentMatches, window.currentZoneIdx || 0);
        };
        slot.ondblclick = (e) => {
            e.stopPropagation();
            const newName = prompt("พิมพ์เพื่อแก้ไขชื่อ (แก้ไขตัวสะกดผิด):", isWaiting ? "" : name);
            if (newName !== null) {
                const upName = newName.trim();
                if (r === 0) {
                    const mIdx = parseInt(mKey.split('-M')[1]);
                    window.currentPlayers[(window.currentZoneIdx * 32) + offset + (mIdx * 2) + pIdx] = { name: upName === "" ? "BYE" : upName };
                } else {
                    if (upName !== "") window.currentMatches[`match-${prevKeyToClear}`] = upName;
                    else delete window.currentMatches[`match-${prevKeyToClear}`];
                }
                window.initBracket(window.currentPlayers, window.currentMatches, window.currentZoneIdx || 0);
            }
        };
    }
    return slot;
}

window.selectZoneChamp = (zIdx, name) => {
    if (!name || name.includes('รอ') || name === 'BYE') return; window.currentMatches[`winner-zone-${zIdx}`] = name;
    window.initBracket(window.currentPlayers, window.currentMatches, window.currentZoneIdx);
};

window.selectGrandChamp = (name) => {
    if (!name || name.includes('รอ') || name === 'BYE') return; window.currentMatches['grand-champion'] = name;
    window.initBracket(window.currentPlayers, window.currentMatches, 99);
};

function createFinalSlot(idx, zoneLetter) {
    const name = window.currentMatches[`winner-zone-${idx}`] || `รอแชมป์ ${zoneLetter}`;
    const isWaiting = !window.currentMatches[`winner-zone-${idx}`];
    let html = `<span class="slot-name">${name}</span>`;
    if (isAdmin() && !isWaiting) {
        html += `<span class="delete-btn" onclick="event.stopPropagation(); if(confirm('ยกเลิกการดึงตัวแชมป์โซน ${zoneLetter} ใช่หรือไม่?')){ delete window.currentMatches['winner-sf-${idx < 2 ? 1 : 2}']; window.initBracket(window.currentPlayers, window.currentMatches, 99); }">✖</span>`;
    }
    return `<div class="player-slot ${isWaiting ? 'waiting' : ''}" onclick="if(isAdmin() && !${isWaiting}){ window.currentMatches['winner-sf-${idx < 2 ? 1 : 2}'] = '${name}'; window.initBracket(window.currentPlayers, window.currentMatches, 99); }">${html}</div>`;
}

function createFinalWinnerSlot(id1, id2) {
    const s1 = window.currentMatches[`winner-${id1}`]; const s2 = window.currentMatches[`winner-${id2}`];
    const html1 = s1 ? `<span class="slot-name">${s1}</span><span class="delete-btn" onclick="event.stopPropagation(); if(confirm('ยกเลิกผลคู่นี้?')){ delete window.currentMatches['winner-${id1}']; window.initBracket(window.currentPlayers, window.currentMatches, 99); }">✖</span>` : `<span class="slot-name">รอคู่ชิง 1</span>`;
    const html2 = s2 ? `<span class="slot-name">${s2}</span><span class="delete-btn" onclick="event.stopPropagation(); if(confirm('ยกเลิกผลคู่นี้?')){ delete window.currentMatches['winner-${id2}']; window.initBracket(window.currentPlayers, window.currentMatches, 99); }">✖</span>` : `<span class="slot-name">รอคู่ชิง 2</span>`;
    return `<div class="player-slot ${!s1?'waiting':''}" onclick="if(isAdmin() && '${s1||""}') selectGrandChamp('${s1}')">${html1}</div><div class="player-slot ${!s2?'waiting':''}" onclick="if(isAdmin() && '${s2||""}') selectGrandChamp('${s2}')">${html2}</div>`;
}

window.resetTournamentData = async () => { /* (คงฟังก์ชันล้างข้อมูลไว้) */ };
window.saveAndGoToBracket = async () => {
    const btn = document.getElementById('saveBtn'); if(btn) btn.innerText = "⏳ บันทึก...";
    const players = Array.from(document.querySelectorAll('.playerName')).map(i => ({ name: i.value.trim() }));
    const cid = document.getElementById('campaignSelectSetup')?.value || "manual";
    try {
        const { db, collection, addDoc, query, where, getDocs, updateDoc, doc } = window.dbFunctions;
        const q = query(collection(db, "tournaments"), where("campaignId", "==", cid));
        const snap = await getDocs(q);
        let dId;
        if (!snap.empty) {
            dId = snap.docs[0].id; await updateDoc(doc(db, "tournaments", dId), { players, updatedAt: new Date() });
        } else {
            const dr = await addDoc(collection(db, "tournaments"), { players, campaignId: cid, createdAt: new Date(), updatedAt: new Date(), matches: {} }); dId = dr.id;
        }
        const base = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
        if(document.getElementById('adminUrl')) document.getElementById('adminUrl').innerText = `${base}bracket.html?id=${dId}`;
        if(document.getElementById('liveUrl')) document.getElementById('liveUrl').innerText = `${base}live.html?id=${dId}`;
        if(document.getElementById('linkDisplayArea')) document.getElementById('linkDisplayArea').style.display = 'block';
    } catch (e) { alert("❌ " + e.message); }
    if(btn) btn.innerText = "💾 บันทึกสายการแข่งขัน";
};
