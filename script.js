window.generateInputFields = () => {
    const count = parseInt(document.getElementById('playerCount').value) || 8;
    const container = document.getElementById('nameFields');
    if (!container) return;
    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:15px; align-items:center; background:rgba(0,0,0,0.3); padding:10px; border-radius:10px; border:1px dashed #555;">
            <span style="color:var(--accent); font-size:0.9em;">📋 ก๊อปปี้รายชื่อจาก Excel มาวางรวดเดียวได้เลย</span>
            <button onclick="bulkPaste()" style="background:var(--status-success); color:white; padding:8px 20px; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">📋 วางรายชื่อ</button>
        </div>
        <div id="tabsArea" class="setup-tabs"></div>
        <div id="zonesArea"></div>
    `;
    const playersPerZone = 32;
    const totalZones = Math.ceil(count / playersPerZone);
    for(let z = 0; z < totalZones; z++) {
        const tab = document.createElement('div');
        tab.className = `setup-tab ${z === 0 ? 'active' : ''}`;
        tab.innerText = `ZONE ${String.fromCharCode(65 + z)}`;
        tab.onclick = () => {
            document.querySelectorAll('.setup-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.zone-container').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`zone-inputs-${z}`).classList.add('active');
        };
        document.getElementById('tabsArea').appendChild(tab);
        const zoneContainer = document.createElement('div');
        zoneContainer.id = `zone-inputs-${z}`;
        zoneContainer.className = `zone-container ${z === 0 ? 'active' : ''}`;
        const grid = document.createElement('div');
        grid.className = 'name-grid';
        for (let i = (z * 32) + 1; i <= Math.min((z + 1) * 32, count); i++) {
            grid.innerHTML += `<div class="form-group"><label style="font-size:0.7em; color:#888;">${i}</label><input type="text" class="playerName" placeholder="ผู้แข่ง"></div>`;
        }
        zoneContainer.appendChild(grid);
        document.getElementById('zonesArea').appendChild(zoneContainer);
    }
    document.getElementById('playerInputs').style.display = 'block';
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
    for (let i = vals.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [vals[i], vals[j]] = [vals[j], vals[i]];
    }
    inputs.forEach((input, i) => { input.value = vals[i]; });
};

window.initBracket = (players, matches = {}, zoneIdx = 0) => {
    window.currentMatches = matches;
    window.currentPlayers = players;
    const container = document.getElementById('bracket');
    if (!container) return;
    container.innerHTML = '';
    const visual = document.createElement('div');
    visual.className = 'bracket-visual';

    if (zoneIdx === 99) {
        visual.innerHTML = `
            <div class="side left-side"><div class="round"><div class="matchup">${createFinalSlot(0,"A")}${createFinalSlot(1,"B")}</div></div></div>
            <div class="champion-area">
                <div class="zone-tag" style="background:var(--gold)">GRAND FINAL</div>
                <div style="color:var(--gold); font-size:1.2em; margin-bottom:10px;">🏆 THE CHAMPION 🏆</div>
                <div class="grand-champion-name" style="font-size:3em; cursor:pointer;" title="ดับเบิลคลิกเพื่อลบแชมป์" ondblclick="if(isAdmin()) { delete window.currentMatches['grand-champion']; window.initBracket(window.currentPlayers, window.currentMatches, 99); }">${window.currentMatches['grand-champion'] || "???"}</div>
                <div class="matchup" style="margin-top:20px; border-color:var(--gold);">${createFinalWinnerSlot("sf-1","sf-2")}</div>
            </div>
            <div class="side right-side"><div class="round"><div class="matchup">${createFinalSlot(2,"C")}${createFinalSlot(3,"D")}</div></div></div>
        `;
    } else {
        const startIdx = zoneIdx * 32;
        const zonePlayers = players.slice(startIdx, startIdx + 32);
        const leftSide = document.createElement('div'); leftSide.className = 'side left-side';
        const rightSide = document.createElement('div'); rightSide.className = 'side right-side';
        for (let r = 0; r < 4; r++) {
            leftSide.appendChild(createZoneRound(r, 8/Math.pow(2,r), `L-Z${zoneIdx}`, zonePlayers, 0));
            rightSide.appendChild(createZoneRound(r, 8/Math.pow(2,r), `R-Z${zoneIdx}`, zonePlayers, 16));
        }
        const winKey = `winner-zone-${zoneIdx}`;
        const LFinal = `match-L-Z${zoneIdx}-R3-M0`; const RFinal = `match-R-Z${zoneIdx}-R3-M0`;
        const champArea = document.createElement('div'); champArea.className = 'champion-area';
        champArea.innerHTML = `
            <div class="zone-tag">ZONE ${String.fromCharCode(65+zoneIdx)}</div>
            <div style="color:var(--gold); font-size:1.1em; margin-bottom:10px;">🏆 ผู้ชนะประจำโซน 🏆</div>
            <div class="grand-champion-name" style="font-size:2.2em; cursor:pointer;" title="ดับเบิลคลิกเพื่อลบแชมป์" ondblclick="if(isAdmin()) { delete window.currentMatches['${winKey}']; window.initBracket(window.currentPlayers, window.currentMatches, window.currentZoneIdx); }">${window.currentMatches[winKey] || "รอผล"}</div>
            <div style="margin-top:30px; font-size:0.9em; color:#888;">แมตช์ชิงแชมป์โซน</div>
            <div class="matchup" style="margin-top:10px; border-color:var(--accent);">
                <div class="player-slot ${!window.currentMatches[LFinal]?'waiting':''}" onclick="if(isAdmin()) selectZoneChamp('${zoneIdx}','${window.currentMatches[LFinal]}')">${window.currentMatches[LFinal]||"รอแชมป์ซ้าย"}</div>
                <div class="player-slot ${!window.currentMatches[RFinal]?'waiting':''}" onclick="if(isAdmin()) selectZoneChamp('${zoneIdx}','${window.currentMatches[RFinal]}')">${window.currentMatches[RFinal]||"รอแชมป์ขวา"}</div>
            </div>`;
        visual.appendChild(leftSide); visual.appendChild(champArea); visual.appendChild(rightSide);
    }
    container.appendChild(visual);
};

window.isAdmin = () => window.location.pathname.includes('bracket.html');

function createZoneRound(r, count, prefix, players, offset) {
    const round = document.createElement('div'); round.className = 'round';
    for (let i = 0; i < count; i++) {
        const mKey = `${prefix}-R${r}-M${i}`;
        const match = document.createElement('div'); match.className = 'matchup';
        match.appendChild(createSlot(r, mKey, 0, players, offset));
        match.appendChild(createSlot(r, mKey, 1, players, offset));
        round.appendChild(match);
    }
    return round;
}

function createSlot(r, mKey, pIdx, players, offset) {
    const slot = document.createElement('div'); slot.className = 'player-slot';
    let name = "รอผล";
    if (r === 0) {
        const mIdx = parseInt(mKey.split('-M')[1]);
        const pIdxInZone = offset + (mIdx * 2) + pIdx;
        name = players[pIdxInZone]?.name || "BYE";
    } else {
        const parts = mKey.split('-R');
        const prevKey = `${parts[0]}-R${r-1}-M${parseInt(parts[1].split('-M')[1])*2 + pIdx}`;
        name = window.currentMatches[`match-${prevKey}`] || "รอผล";
    }
    slot.innerText = name;
    if (name === "รอผล" || name === "BYE") slot.classList.add('waiting');

    if (isAdmin()) {
        slot.onclick = () => {
            if (name === "รอผล" || name === "BYE") return;
            window.currentMatches[`match-${mKey}`] = name;
            window.initBracket(window.currentPlayers, window.currentMatches, window.currentZoneIdx || 0);
        };
        // 🎯 ระบบดับเบิลคลิกเพื่อลบ/แก้ชื่อ
        slot.ondblclick = (e) => {
            e.stopPropagation();
            const newName = prompt("แก้ไขชื่อนักกีฬา (ลบข้อความออกให้ว่างเปล่าเพื่อ 'ยกเลิก' ผลคู่นี้):", name.includes("รอ") || name === "BYE" ? "" : name);
            if (newName !== null) {
                const updatedName = newName.trim();
                if (r === 0) {
                    const mIdx = parseInt(mKey.split('-M')[1]);
                    const pIdxInZone = (window.currentZoneIdx * 32) + offset + (mIdx * 2) + pIdx;
                    window.currentPlayers[pIdxInZone] = { name: updatedName === "" ? "BYE" : updatedName };
                } else {
                    if (updatedName === "") {
                        delete window.currentMatches[`match-${mKey}`]; // ลบผลการแข่งออก
                    } else {
                        window.currentMatches[`match-${mKey}`] = updatedName;
                    }
                }
                window.initBracket(window.currentPlayers, window.currentMatches, window.currentZoneIdx || 0);
            }
        };
    }
    return slot;
}

window.selectZoneChamp = (zIdx, name) => {
    if (!name || name.includes('รอ') || name === 'BYE') return;
    window.currentMatches[`winner-zone-${zIdx}`] = name;
    window.initBracket(window.currentPlayers, window.currentMatches, window.currentZoneIdx);
};

window.selectGrandChamp = (name) => {
    if (!name || name.includes('รอ') || name === 'BYE') return;
    window.currentMatches['grand-champion'] = name;
    window.initBracket(window.currentPlayers, window.currentMatches, 99);
};

function createFinalSlot(idx, zoneLetter) {
    const name = window.currentMatches[`winner-zone-${idx}`] || `รอแชมป์ ${zoneLetter}`;
    const slot = document.createElement('div'); slot.className = `player-slot ${!window.currentMatches[`winner-zone-${idx}`] ? 'waiting' : ''}`;
    slot.innerText = name;
    if (isAdmin() && !name.includes('รอ')) {
        slot.onclick = () => { window.currentMatches[`winner-sf-${idx < 2 ? 1 : 2}`] = name; window.initBracket(window.currentPlayers, window.currentMatches, 99); };
        slot.ondblclick = (e) => { 
            e.stopPropagation(); 
            const n = prompt("แก้ไขชื่อ:", name); 
            if(n!==null) { window.currentMatches[`winner-zone-${idx}`] = n.trim(); window.initBracket(window.currentPlayers, window.currentMatches, 99); }
        };
    }
    return slot.outerHTML;
}

function createFinalWinnerSlot(id1, id2) {
    const s1 = window.currentMatches[`winner-${id1}`]; const s2 = window.currentMatches[`winner-${id2}`];
    return `
        <div class="player-slot ${!s1?'waiting':''}" onclick="if(isAdmin()) selectGrandChamp('${s1||""}')" ondblclick="if(isAdmin()&&'${s1}') { delete window.currentMatches['winner-${id1}']; window.initBracket(window.currentPlayers, window.currentMatches, 99); }">${s1||"รอคู่ชิง 1"}</div>
        <div class="player-slot ${!s2?'waiting':''}" onclick="if(isAdmin()) selectGrandChamp('${s2||""}')" ondblclick="if(isAdmin()&&'${s2}') { delete window.currentMatches['winner-${id2}']; window.initBracket(window.currentPlayers, window.currentMatches, 99); }">${s2||"รอคู่ชิง 2"}</div>
    `;
}

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
            dId = snap.docs[0].id;
            await updateDoc(doc(db, "tournaments", dId), { players, updatedAt: new Date() });
        } else {
            const dr = await addDoc(collection(db, "tournaments"), { players, campaignId: cid, createdAt: new Date(), updatedAt: new Date(), matches: {} });
            dId = dr.id;
        }
        const base = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
        if(document.getElementById('adminUrl')) document.getElementById('adminUrl').innerText = `${base}bracket.html?id=${dId}`;
        if(document.getElementById('liveUrl')) document.getElementById('liveUrl').innerText = `${base}live.html?id=${dId}`;
        if(document.getElementById('linkDisplayArea')) document.getElementById('linkDisplayArea').style.display = 'block';
        alert("✅ บันทึกเรียบร้อย!");
    } catch (e) { alert("❌ " + e.message); }
    if(btn) btn.innerText = "💾 บันทึกสายการแข่งขัน";
};

// 🗑️ ฟังก์ชันรีเซ็ตผลการแข่งขันทั้งหมดของรายการนั้นๆ
window.resetTournamentData = async () => {
    const campaignId = document.getElementById('campaignSelectSetup')?.value;
    if(!campaignId) { 
        alert("กรุณาเลือกรายการแข่งขันก่อนครับ"); 
        return; 
    }

    if(!confirm("⚠️ คำเตือนอันตราย!\n\nคุณแน่ใจหรือไม่ที่จะ 'ล้างผลการแข่งขันทั้งหมด' ของรายการนี้?\n(รายชื่อที่จัดไว้จะยังอยู่ แต่ผลแพ้-ชนะ และแชมป์จะหายไปทั้งหมด)")) {
        return;
    }

    const btn = document.getElementById('resetTourneyBtn');
    if(btn) btn.innerText = "⏳ กำลังล้างข้อมูล...";

    try {
        const { db, collection, query, where, getDocs, updateDoc, doc } = window.dbFunctions;
        const q = query(collection(db, "tournaments"), where("campaignId", "==", campaignId));
        const snap = await getDocs(q);

        if (!snap.empty) {
            const docId = snap.docs[0].id;
            // 💥 สั่งเขียนทับ matches ให้กลายเป็นค่าว่าง {}
            await updateDoc(doc(db, "tournaments", docId), { 
                matches: {}, 
                updatedAt: new Date() 
            });
            alert("✅ ล้างผลการแข่งขันเรียบร้อย! เริ่มแข่งใหม่ได้เลยครับ");
            
            // รีเฟรชหน้าจอเพื่อดึงข้อมูลที่ว่างเปล่ามาใหม่
            window.location.reload();
        } else {
            alert("ยังไม่มีข้อมูลการจัดสายสำหรับรายการนี้ครับ");
        }
    } catch (e) {
        alert("❌ เกิดข้อผิดพลาด: " + e.message);
    } finally {
        if(btn) btn.innerText = "🗑️ ล้างผลการแข่งทั้งหมด (Reset)";
    }
};
