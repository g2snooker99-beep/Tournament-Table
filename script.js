// โหลด Canvas Confetti Library
if (!document.getElementById('confetti-script')) {
    const script = document.createElement('script');
    script.id = 'confetti-script';
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
    document.head.appendChild(script);
}

// ── BYE helper ──
function isByeName(name) {
    if (!name) return true;
    const n = name.trim().toUpperCase();
    return n === 'BYE' || n === '' || n === '— BYE —';
}

// ── Auto-advance เมื่อฝั่งใดเป็น BYE (Round 0) ──
function processAutoByeMatches(players, zoneIdx) {
    if (zoneIdx === 99) return;
    const startIdx = zoneIdx * 32;
    const zonePlayers = players.slice(startIdx, startIdx + 32);

    [
        { prefix: `L-Z${zoneIdx}`, offset: 0 },
        { prefix: `R-Z${zoneIdx}`, offset: 16 }
    ].forEach(({ prefix, offset }) => {
        for (let mIdx = 0; mIdx < 8; mIdx++) {
            const mKey = `match-${prefix}-R0-M${mIdx}`;
            const nameA = (zonePlayers[offset + mIdx * 2]?.name || '').trim();
            const nameB = (zonePlayers[offset + mIdx * 2 + 1]?.name || '').trim();
            const byeA = isByeName(nameA);
            const byeB = isByeName(nameB);

            if (!window.currentMatches[mKey]) {
                if (!byeA && byeB)  window.currentMatches[mKey] = nameA;
                else if (byeA && !byeB) window.currentMatches[mKey] = nameB;
                // ทั้งคู่ BYE = ปล่อยว่าง
            }
        }
    });
}

window.generateInputFields = () => {
    const count = parseInt(document.getElementById('playerCount').value) || 8;
    const container = document.getElementById('nameFields');
    if (!container) return;
    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:15px; align-items:center; background:rgba(0,0,0,0.3); padding:10px; border-radius:10px; border:1px dashed #555;">
            <div style="display:flex; gap:10px;">
                <button onclick="fillTestData()" style="background:linear-gradient(135deg, #f39c12 0%, #d68910 100%); color:#000; padding:8px 20px; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">🤖 เติมชื่อทดสอบลงช่องว่าง</button>
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
    const inputs = Array.from(document.querySelectorAll('.playerName'));
    if (inputs.length === 0) return;
    const emptyInputs = inputs.filter((input) => !input.value.trim());
    if (emptyInputs.length === 0) { alert("ไม่มีช่องว่างให้เติมชื่อทดสอบแล้ว"); return; }
    const existingNames = new Set(inputs.map((input) => input.value.trim().toLowerCase()).filter(Boolean));
    let nextNumber = 1;
    emptyInputs.forEach((input) => {
        while (existingNames.has(`p-${nextNumber}`)) { nextNumber++; }
        const testName = `P-${nextNumber}`;
        input.value = testName;
        existingNames.add(testName.toLowerCase());
        input.style.borderColor = "var(--gold)";
        setTimeout(() => { input.style.borderColor = "transparent"; }, 800);
        nextNumber++;
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
    const originalVals = inputs.map(i => i.value);
    let finalVals = [...originalVals];
    for (let i = finalVals.length - 1; i > 0; i--) { 
        const j = Math.floor(Math.random() * (i + 1)); 
        [finalVals[i], finalVals[j]] = [finalVals[j], finalVals[i]]; 
    }
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(btn => btn.style.pointerEvents = 'none');
    inputs.forEach(input => input.classList.add('is-shuffling'));
    let shufflesCount = 0;
    const maxShuffles = 20;
    const speed = 100;
    const shuffleInterval = setInterval(() => {
        let tempVals = [...originalVals];
        for (let i = tempVals.length - 1; i > 0; i--) { 
            const j = Math.floor(Math.random() * (i + 1)); 
            [tempVals[i], tempVals[j]] = [tempVals[j], tempVals[i]]; 
        }
        inputs.forEach((input, i) => { input.value = tempVals[i]; });
        shufflesCount++;
        if (shufflesCount >= maxShuffles) {
            clearInterval(shuffleInterval);
            inputs.forEach((input, i) => { 
                input.value = finalVals[i];
                input.classList.remove('is-shuffling');
                input.style.boxShadow = '0 0 15px var(--status-success)';
                input.style.borderColor = 'var(--status-success)';
                input.style.background = 'rgba(40, 167, 69, 0.1)';
                setTimeout(() => { input.style.boxShadow = ''; input.style.borderColor = ''; input.style.background = ''; }, 1500);
            });
            allButtons.forEach(btn => btn.style.pointerEvents = 'auto');
            if (typeof confetti !== 'undefined') {
                confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, zIndex: 9999 });
            }
        }
    }, speed);
};

window.isAdmin = () => window.location.pathname.includes('bracket.html');

window.initBracket = (players, matches = {}, zoneIdx = 0) => {
    window.currentMatches = matches; window.currentPlayers = players;
    const container = document.getElementById('bracket'); if (!container) return; container.innerHTML = '';
    const visual = document.createElement('div'); visual.className = 'bracket-visual';

    // ── Auto-advance BYE ก่อน render ──
    if (zoneIdx !== 99) {
        processAutoByeMatches(players, zoneIdx);
    }

    if (zoneIdx === 99) {
        visual.style.transform = "scale(1.1)"; 
        visual.innerHTML = `
            <div class="side left-side" style="margin-right: 30px;">
                <div class="round">
                    <div style="text-align:center; color:var(--accent); margin-bottom:15px; font-weight:900; letter-spacing:2px; font-size:1.2em; text-shadow:0 0 10px var(--accent-glow);">SEMI-FINAL 1</div>
                    <div class="matchup" style="border: 2px solid var(--accent); box-shadow: 0 0 30px rgba(0,212,255,0.15); padding: 20px; border-radius: 15px; background: rgba(0,212,255,0.05);">
                        ${createFinalSlot(0,"A")}
                        ${createFinalSlot(1,"B")}
                    </div>
                </div>
            </div>
            <div class="champion-area" style="padding: 50px; transform: scale(1.15); box-shadow: 0 0 60px rgba(255,215,0,0.15); background: radial-gradient(circle, rgba(255,215,0,0.1) 0%, rgba(0,0,0,0) 80%); border-width: 4px; z-index: 10;">
                <div class="zone-tag" style="background:var(--gold); box-shadow: 0 0 20px var(--gold-glow); font-size:1.8em; padding: 10px 40px; margin-bottom:30px;">GRAND FINAL</div>
                <div style="color:var(--gold); font-size:1.4em; margin-bottom:10px; text-transform:uppercase; letter-spacing:4px; font-weight:900;">🏆 THE CHAMPION 🏆</div>
                <div class="grand-champion-name ${window.currentMatches['grand-champion'] ? 'epic-win' : ''}" style="font-size:4.5em; text-shadow: 0 0 30px var(--gold); display:flex; align-items:center; justify-content:center; margin-bottom: 40px;">
                    <span class="slot-name">${window.currentMatches['grand-champion'] || "???"}</span>
                    ${isAdmin() && window.currentMatches['grand-champion'] ? `<span class="delete-btn" style="font-size:24px; width:45px; height:45px; margin-left:20px;" onclick="if(confirm('ยกเลิกแชมป์รายการใช่หรือไม่?')){ delete window.currentMatches['grand-champion']; window.initBracket(window.currentPlayers, window.currentMatches, 99); }">✖</span>` : ''}
                </div>
                <div style="color:#aaa; margin-bottom:15px; font-size:1.1em; letter-spacing:2px; font-weight:bold;">CHAMPIONSHIP MATCH</div>
                <div class="matchup" style="border: 3px solid var(--gold); box-shadow: 0 0 40px rgba(255,215,0,0.3); padding: 30px; border-radius: 15px; background: rgba(255,215,0,0.05);">
                    ${createFinalWinnerSlot("sf-1","sf-2")}
                </div>
            </div>
            <div class="side right-side" style="margin-left: 30px;">
                <div class="round">
                    <div style="text-align:center; color:var(--accent); margin-bottom:15px; font-weight:900; letter-spacing:2px; font-size:1.2em; text-shadow:0 0 10px var(--accent-glow);">SEMI-FINAL 2</div>
                    <div class="matchup" style="border: 2px solid var(--accent); box-shadow: 0 0 30px rgba(0,212,255,0.15); padding: 20px; border-radius: 15px; background: rgba(0,212,255,0.05);">
                        ${createFinalSlot(2,"C")}
                        ${createFinalSlot(3,"D")}
                    </div>
                </div>
            </div>
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
    let prevKeyToClear = null; 
    
    if (r === 0) {
        const mIdx = parseInt(mKey.split('-M')[1]);
        name = players[offset + (mIdx * 2) + pIdx]?.name || "BYE";
    } else {
        const parts = mKey.split('-R'); 
        const prevMatchIdx = parseInt(parts[1].split('-M')[1]) * 2 + pIdx;
        prevKeyToClear = `${parts[0]}-R${r-1}-M${prevMatchIdx}`;
        name = window.currentMatches[`match-${prevKeyToClear}`] || "รอผล";
    }

    // ── BYE slot ──
    const bye = isByeName(name) && name !== 'รอผล';
    const isWaiting = name === "รอผล" || bye;

    if (isWaiting) slot.classList.add('waiting');
    if (bye) {
        slot.classList.add('is-bye');
        slot.style.cssText = `
            opacity: 0.35;
            border-left-color: rgba(255,255,255,0.05) !important;
            border-right-color: rgba(255,255,255,0.05) !important;
            pointer-events: none;
            font-style: italic;
            letter-spacing: 2px;
            font-size: 0.82em;
            color: #445 !important;
            background: rgba(0,0,0,0.2) !important;
        `;
        slot.innerHTML = `<span class="slot-name" style="color:#445;">— BYE —</span>`;
        return slot;
    }

    slot.innerHTML = `<span class="slot-name">${name}</span>`;

    if (isAdmin() && !isWaiting) {
        const delBtn = document.createElement('span'); delBtn.className = 'delete-btn'; delBtn.innerHTML = '✖'; delBtn.title = "ลบชื่อ / ยกเลิกผล";
        delBtn.onclick = (e) => {
            e.stopPropagation();
            if(confirm(`ต้องการยกเลิกผลของ "${name}" ใช่หรือไม่?`)) {
                if (r === 0) {
                    const mIdx = parseInt(mKey.split('-M')[1]);
                    window.currentPlayers[(window.currentZoneIdx * 32) + offset + (mIdx * 2) + pIdx] = { name: "BYE" };
                } else {
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
    if (!name || name.includes('รอ') || isByeName(name)) return;
    window.currentMatches[`winner-zone-${zIdx}`] = name;
    window.initBracket(window.currentPlayers, window.currentMatches, window.currentZoneIdx);
};

window.selectGrandChamp = (name) => {
    if (!name || name.includes('รอ') || isByeName(name)) return;
    window.currentMatches['grand-champion'] = name;
    window.initBracket(window.currentPlayers, window.currentMatches, 99);
    setTimeout(() => {
        document.body.classList.add('shake-screen');
        setTimeout(() => document.body.classList.remove('shake-screen'), 600);
        if (typeof confetti !== 'undefined') {
            var duration = 10 * 1000; var end = Date.now() + duration;
            (function frame() {
                confetti({ particleCount: 7, angle: 60, spread: 55, origin: { x: 0, y: 0.8 }, colors: ['#ffd700', '#ffffff', '#00d4ff'], zIndex: 9999 });
                confetti({ particleCount: 7, angle: 120, spread: 55, origin: { x: 1, y: 0.8 }, colors: ['#ffd700', '#ffffff', '#00d4ff'], zIndex: 9999 });
                if (Date.now() < end) requestAnimationFrame(frame);
            }());
        }
    }, 100);
};

function createFinalSlot(idx, zoneLetter) {
    const name = window.currentMatches[`winner-zone-${idx}`] || `รอแชมป์ ${zoneLetter}`;
    const isWaiting = !window.currentMatches[`winner-zone-${idx}`];
    let html = `<span class="slot-name">${name}</span>`;
    if (isAdmin() && !isWaiting) {
        html += `<span class="delete-btn" onclick="event.stopPropagation(); if(confirm('ยกเลิกการดึงตัวแชมป์โซน ${zoneLetter} ใช่หรือไม่?')){ delete window.currentMatches['winner-sf-${idx < 2 ? 1 : 2}']; window.initBracket(window.currentPlayers, window.currentMatches, 99); }">✖</span>`;
    }
    return `<div class="player-slot ${isWaiting ? 'waiting' : ''}" style="padding: 20px; font-size: 1.5em; margin-bottom: 15px;" onclick="if(isAdmin() && !${isWaiting}){ window.currentMatches['winner-sf-${idx < 2 ? 1 : 2}'] = '${name}'; window.initBracket(window.currentPlayers, window.currentMatches, 99); }">${html}</div>`;
}

function createFinalWinnerSlot(id1, id2) {
    const s1 = window.currentMatches[`winner-${id1}`]; const s2 = window.currentMatches[`winner-${id2}`];
    const html1 = s1 ? `<span class="slot-name">${s1}</span><span class="delete-btn" onclick="event.stopPropagation(); if(confirm('ยกเลิกผลคู่นี้?')){ delete window.currentMatches['winner-${id1}']; window.initBracket(window.currentPlayers, window.currentMatches, 99); }">✖</span>` : `<span class="slot-name">รอคู่ชิง 1</span>`;
    const html2 = s2 ? `<span class="slot-name">${s2}</span><span class="delete-btn" onclick="event.stopPropagation(); if(confirm('ยกเลิกผลคู่นี้?')){ delete window.currentMatches['winner-${id2}']; window.initBracket(window.currentPlayers, window.currentMatches, 99); }">✖</span>` : `<span class="slot-name">รอคู่ชิง 2</span>`;
    return `<div class="player-slot ${!s1?'waiting':''}" style="padding: 25px; font-size: 1.8em; margin-bottom: 20px;" onclick="if(isAdmin() && '${s1||""}') selectGrandChamp('${s1}')">${html1}</div><div class="player-slot ${!s2?'waiting':''}" style="padding: 25px; font-size: 1.8em;" onclick="if(isAdmin() && '${s2||""}') selectGrandChamp('${s2}')">${html2}</div>`;
}

window.resetTournamentData = async () => {
    const cid = document.getElementById('campaignSelectSetup')?.value;
    if (!cid) { alert("กรุณาเลือกรายการแข่งขันก่อน"); return; }
    if (!confirm("ต้องการล้างผลการแข่งขันทั้งหมดและเริ่มใหม่ใช่หรือไม่?")) return;
    const btn = document.getElementById('resetTourneyBtn');
    const originalText = btn?.innerText;
    if (btn) { btn.disabled = true; btn.innerText = "⏳ กำลังล้างผลการแข่งขัน..."; }
    try {
        const { db, collection, query, where, getDocs, updateDoc, doc } = window.dbFunctions;
        const q = query(collection(db, "tournaments"), where("campaignId", "==", cid));
        const snap = await getDocs(q);
        if (snap.empty) { alert("ยังไม่มีข้อมูลสายการแข่งขันให้ล้าง"); return; }
        const tourneyDoc = snap.docs[0];
        await updateDoc(doc(db, "tournaments", tourneyDoc.id), { matches: {}, updatedAt: new Date() });
        window.currentMatches = {};
        alert("✅ ล้างผลการแข่งขันเรียบร้อย");
        if (typeof window.checkExistingSetup === "function") await window.checkExistingSetup();
    } catch (e) { alert("❌ " + e.message); }
    finally { if (btn) { btn.disabled = false; btn.innerText = originalText || "🗑️ ล้างผลการแข่งทั้งหมด (Reset เริ่มใหม่)"; } }
};

window.saveAndGoToBracket = async () => {
    const btn = document.getElementById('saveBtn');
    if (btn) btn.innerText = "⏳ บันทึก...";
    const players = Array.from(document.querySelectorAll('.playerName')).map(i => ({
        name: i.value.trim() || 'BYE'
    }));
    const campaignSelect = document.getElementById('campaignSelectSetup');
    const cid = campaignSelect?.value || "manual";
    const campaignName = campaignSelect?.selectedOptions?.[0]?.text?.trim() || "Manual Tournament";
    try {
        const { db, collection, addDoc, query, where, getDocs, updateDoc, doc } = window.dbFunctions;
        const q = query(collection(db, "tournaments"), where("campaignId", "==", cid));
        const snap = await getDocs(q);
        let dId;
        if (!snap.empty) {
            dId = snap.docs[0].id;
            await updateDoc(doc(db, "tournaments", dId), { players, campaignName, updatedAt: new Date() });
        } else {
            const dr = await addDoc(collection(db, "tournaments"), {
                players, campaignId: cid, campaignName,
                createdAt: new Date(), updatedAt: new Date(), matches: {}
            });
            dId = dr.id;
        }
        const base = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
        const adminLink = `${base}bracket.html?id=${dId}`;
        const liveLink = `${base}live.html?id=${dId}`;
        if (document.getElementById('adminUrl')) { document.getElementById('adminUrl').innerText = adminLink; document.getElementById('adminUrl').href = adminLink; }
        if (document.getElementById('liveUrl')) { document.getElementById('liveUrl').innerText = liveLink; document.getElementById('liveUrl').href = liveLink; }
        if (document.getElementById('linkDisplayArea')) document.getElementById('linkDisplayArea').style.display = 'block';
    } catch (e) { alert("❌ " + e.message); }
    if (btn) btn.innerText = "💾 บันทึกสายการแข่งขัน";
};