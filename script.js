// ==========================================
// 1. ระบบจัดการการกรอกชื่อ (Setup Page)
// ==========================================
window.generateInputFields = () => {
    const count = parseInt(document.getElementById('playerCount').value) || 8;
    const container = document.getElementById('nameFields');
    if (!container) return;
    
    container.innerHTML = '';
    for (let i = 1; i <= count; i++) {
        const div = document.createElement('div');
        div.className = 'form-group';
        div.style.marginBottom = '10px';
        div.innerHTML = `
            <label style="font-size:0.8em; color:#666;">ช่องที่ ${i}</label>
            <input type="text" class="playerName" placeholder="พิมพ์ชื่อผู้แข่ง หรือปล่อยว่างไว้เพื่อ BYE" style="padding:12px; background:rgba(0,0,0,0.3); border:1px solid #333; color:white; border-radius:8px; width:100%; box-sizing:border-box;">
        `;
        container.appendChild(div);
    }
    document.getElementById('playerInputs').style.display = 'block';
};

window.saveAndGoToBracket = async () => {
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    saveBtn.innerText = "⏳ กำลังบันทึกข้อมูล...";

    const playerInputs = document.querySelectorAll('.playerName');
    const players = Array.from(playerInputs).map(input => ({ name: input.value.trim() }));
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
        document.getElementById('adminUrl').innerText = `${baseUrl}bracket.html?id=${docId}`;
        document.getElementById('liveUrl').innerText = `${baseUrl}live.html?id=${docId}`;
        document.getElementById('linkDisplayArea').style.display = 'block';
        
        alert("✅ บันทึกและอัปเดตสายการแข่งขันเรียบร้อย!");
    } catch (e) {
        alert("❌ บันทึกไม่สำเร็จ: " + e.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerText = "💾 บันทึกและอัปเดตสายการแข่งขัน";
    }
};

// ==========================================
// 2. ระบบวาดตารางการแข่งขัน (Bracket Render)
// ==========================================
window.currentMatches = {};

window.initBracket = (players, matches = {}) => {
    window.currentMatches = matches;
    const container = document.getElementById('bracket');
    if (!container) return;
    container.innerHTML = '';

    const totalPlayers = players.length;
    const roundsCount = Math.log2(totalPlayers);
    
    // สร้างฝั่งซ้ายและขวา (กางปีก)
    const leftSide = document.createElement('div');
    leftSide.className = 'side left-side';
    const rightSide = document.createElement('div');
    rightSide.className = 'side right-side';

    // วาดรอบต่างๆ (ยกเว้นรอบชิง)
    for (let r = 0; r < roundsCount - 1; r++) {
        leftSide.appendChild(createRound(r, totalPlayers / 2, 'left', players));
        rightSide.appendChild(createRound(r, totalPlayers / 2, 'right', players));
    }

    // รอบชิง (Grand Final)
    const championArea = document.createElement('div');
    championArea.className = 'champion-area';
    
    const finalMatchId = `match-${roundsCount-1}-0`;
    const winnerName = window.currentMatches[finalMatchId] || "???";
    
    championArea.innerHTML = `
        <div class="champion-title">GRAND CHAMPION</div>
        <div class="grand-champion-name">${winnerName}</div>
        <div class="final-matchup">
            <div class="round-title">Final Match</div>
            <div class="matchup" id="${finalMatchId}">
                ${createPlayerSlot(roundsCount-1, 0, 0, players)}
                ${createPlayerSlot(roundsCount-1, 0, 1, players)}
            </div>
        </div>
    `;

    container.appendChild(leftSide);
    container.appendChild(championArea);
    container.appendChild(rightSide);
};

function createRound(roundIdx, matchCount, side, players) {
    const roundDiv = document.createElement('div');
    roundDiv.className = 'round';
    const currentMatchCount = matchCount / Math.pow(2, roundIdx);
    
    for (let i = 0; i < currentMatchCount; i++) {
        const matchDiv = document.createElement('div');
        matchDiv.className = 'matchup';
        const matchId = `match-${roundIdx}-${side === 'left' ? i : i + currentMatchCount}`;
        matchDiv.id = matchId;
        
        matchDiv.appendChild(createPlayerSlot(roundIdx, side === 'left' ? i : i + currentMatchCount, 0, players));
        matchDiv.appendChild(createPlayerSlot(roundIdx, side === 'left' ? i : i + currentMatchCount, 1, players));
        
        roundDiv.appendChild(matchDiv);
    }
    return roundDiv;
}

function createPlayerSlot(roundIdx, matchIdx, playerIdx, players) {
    const slot = document.createElement('div');
    slot.className = 'player-slot';
    
    let playerName = "???";
    
    if (roundIdx === 0) {
        // รอบแรก ดึงชื่อจากรายชื่อที่สมัคร
        const pIdx = (matchIdx * 2) + playerIdx;
        playerName = players[pIdx]?.name || "BYE";
    } else {
        // รอบต่อๆ ไป ดึงชื่อผู้ชนะจากแมตช์ก่อนหน้า
        const prevMatchIdx = matchIdx * 2 + playerIdx;
        const prevMatchId = `match-${roundIdx-1}-${prevMatchIdx}`;
        playerName = window.currentMatches[prevMatchId] || "รอผลการแข่ง";
    }

    slot.innerText = playerName;
    if (playerName === "รอผลการแข่ง" || playerName === "BYE") slot.classList.add('waiting');

    // ถ้าอยู่ในหน้า bracket.html (Admin) ให้คลิกเพื่อเลือกผู้ชนะได้
    if (window.location.pathname.includes('bracket.html') && playerName !== "รอผลการแข่ง" && playerName !== "BYE") {
        slot.onclick = () => {
            const currentMatchId = `match-${roundIdx}-${matchIdx}`;
            window.currentMatches[currentMatchId] = playerName;
            // วาดตารางใหม่เพื่ออัปเดตสาย
            window.initBracket(players, window.currentMatches);
        };
    }

    return slot;
}
