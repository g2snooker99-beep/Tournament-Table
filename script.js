window.generateInputFields = () => {
    const count = parseInt(document.getElementById('playerCount').value) || 8;
    const container = document.getElementById('nameFields');
    if (!container) return;
    
    // โครงสร้างหน้าต่างกรอกแบบใหม่
    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:15px; align-items:center; background:rgba(0,0,0,0.3); padding:10px; border-radius:10px; border:1px dashed #555;">
            <span style="color:var(--accent); font-size:0.9em;">💡 <b>ทริค:</b> ก๊อปปี้รายชื่อจาก Excel มาวางรวดเดียวได้เลย</span>
            <button onclick="bulkPaste()" style="background:var(--status-success); color:white; padding:8px 20px; border:none; border-radius:8px; cursor:pointer; font-weight:bold; box-shadow:0 0 10px rgba(40,167,69,0.4);">📋 วางรายชื่อทั้งหมด</button>
        </div>
        <div id="tabsArea" class="setup-tabs"></div>
        <div id="zonesArea"></div>
    `;

    const tabsArea = document.getElementById('tabsArea');
    const zonesArea = document.getElementById('zonesArea');

    const playersPerZone = 32;
    const totalZones = Math.ceil(count / playersPerZone);

    for(let z = 0; z < totalZones; z++) {
        // สร้างปุ่ม Tab ถ้ามีคนเกิน 32 คน
        if(totalZones > 1) {
            const tab = document.createElement('div');
            tab.className = `setup-tab ${z === 0 ? 'active' : ''}`;
            tab.innerText = `ZONE ${String.fromCharCode(65 + z)}`;
            tab.onclick = () => {
                document.querySelectorAll('.setup-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.zone-container').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(`zone-inputs-${z}`).classList.add('active');
            };
            tabsArea.appendChild(tab);
        }

        // สร้างพื้นที่กรอกของแต่ละ Zone
        const zoneContainer = document.createElement('div');
        zoneContainer.id = `zone-inputs-${z}`;
        zoneContainer.className = `zone-container ${z === 0 ? 'active' : ''}`;
        
        const grid = document.createElement('div');
        grid.className = 'name-grid';

        const startNum = z * playersPerZone + 1;
        const endNum = Math.min((z + 1) * playersPerZone, count);

        // สร้างช่องกรอกเรียงกันแบบ 4 คอลัมน์
        for (let i = startNum; i <= endNum; i++) {
            const div = document.createElement('div');
            div.className = 'form-group';
            div.style.marginBottom = '0';
            div.innerHTML = `
                <label style="font-size:0.75em; color:#888; margin-bottom:4px;">ช่อง ${i}</label>
                <input type="text" class="playerName" placeholder="ผู้แข่ง" style="padding:10px; font-size:0.95em; border-radius:6px; background:#111;">
            `;
            grid.appendChild(div);
        }
        zoneContainer.appendChild(grid);
        zonesArea.appendChild(zoneContainer);
    }

    document.getElementById('playerInputs').style.display = 'block';
};

// ฟังก์ชันไม้ตาย: วางรายชื่อจาก Clipboard
window.bulkPaste = () => {
    const text = prompt("ก๊อปปี้รายชื่อเรียงบรรทัดกัน แล้วนำมาวางที่นี่:");
    if(!text) return;
    const names = text.split('\n').map(n => n.trim()).filter(n => n !== "");
    const inputs = document.querySelectorAll('.playerName');
    
    let filled = 0;
    for(let i=0; i<names.length; i++) {
        if(inputs[i]) {
            inputs[i].value = names[i];
            filled++;
        }
    }
    alert(`✅ วางรายชื่อเรียบร้อย ${filled} คน`);
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
