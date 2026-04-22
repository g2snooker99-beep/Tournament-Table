window.generateInputFields = () => {
    const count = parseInt(document.getElementById('playerCount').value) || 8;
    const container = document.getElementById('nameFields');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 1; i <= count; i++) {
        const div = document.createElement('div');
        div.innerHTML = `<label style="font-size:0.8em; color:#666;">ช่องที่ ${i}</label>
                         <input type="text" class="playerName" placeholder="พิมพ์ชื่อผู้แข่ง หรือปล่อยว่าง">`;
        container.appendChild(div);
    }
    document.getElementById('playerInputs').style.display = 'block';
};

window.initBracket = (players, matches = {}) => {
    window.currentMatches = matches;
    const container = document.getElementById('bracket');
    if (!container) return;
    container.innerHTML = '';

    const totalCount = players.length;
    const roundsCount = Math.ceil(Math.log2(totalCount));
    
    // สร้างโครงสร้างกางปีก
    const bracketVisual = document.createElement('div');
    bracketVisual.className = 'bracket-visual';

    const leftSide = document.createElement('div');
    leftSide.className = 'side left-side';
    const rightSide = document.createElement('div');
    rightSide.className = 'side right-side';

    // วาดรอบต่างๆ แบ่งซ้ายขวา
    for (let r = 0; r < roundsCount - 1; r++) {
        const matchesInRound = totalCount / Math.pow(2, r + 1);
        leftSide.appendChild(createRoundUI(r, matchesInRound / 2, 'L', players));
        rightSide.appendChild(createRoundUI(r, matchesInRound / 2, 'R', players));
    }

    // โซนแชมป์ (ตรงกลาง)
    const champMatchId = `match-${roundsCount-1}-F`;
    const championName = window.currentMatches[champMatchId] || "???";
    const champArea = document.createElement('div');
    champArea.className = 'champion-area';
    champArea.innerHTML = `
        <div style="color:var(--gold); letter-spacing:3px;">GRAND CHAMPION</div>
        <div class="grand-champion-name">${championName}</div>
        <div class="matchup" id="${champMatchId}">
            ${createPlayerUI(roundsCount-1, 'F', 0, players)}
            ${createPlayerUI(roundsCount-1, 'F', 1, players)}
        </div>
    `;

    bracketVisual.appendChild(leftSide);
    bracketVisual.appendChild(champArea);
    bracketVisual.appendChild(rightSide);
    container.appendChild(bracketVisual);
};

function createRoundUI(roundIdx, matchCount, side, players) {
    const roundDiv = document.createElement('div');
    roundDiv.className = 'round';
    for (let i = 0; i < matchCount; i++) {
        const matchId = `match-${roundIdx}-${side}${i}`;
        const matchDiv = document.createElement('div');
        matchDiv.className = 'matchup';
        matchDiv.id = matchId;
        matchDiv.appendChild(createPlayerUI(roundIdx, `${side}${i}`, 0, players));
        matchDiv.appendChild(createPlayerUI(roundIdx, `${side}${i}`, 1, players));
        roundDiv.appendChild(matchDiv);
    }
    return roundDiv;
}

function createPlayerUI(roundIdx, matchKey, playerIdx, players) {
    const slot = document.createElement('div');
    slot.className = 'player-slot';
    let name = "รอผลการแข่ง";

    if (roundIdx === 0) {
        // รอบแรก ดึงจากรายชื่อ (คำนวณตำแหน่งจาก SideL/R)
        const isRight = matchKey.startsWith('R');
        const mIdx = parseInt(matchKey.substring(1));
        const offset = isRight ? players.length / 2 : 0;
        const pIdx = offset + (mIdx * 2) + playerIdx;
        name = players[pIdx]?.name || "BYE";
    } else {
        // รอบต่อๆ ไป ดึงจากผู้ชนะแมตช์ก่อนหน้า
        const side = matchKey[0];
        const mIdx = parseInt(matchKey.substring(1)) || 0;
        const prevMatchKey = `${side}${mIdx * 2 + playerIdx}`;
        name = window.currentMatches[`match-${roundIdx-1}-${prevMatchKey}`] || "รอผลการแข่ง";
    }

    slot.innerText = name;
    if (name === "รอผลการแข่ง" || name === "BYE") slot.classList.add('waiting');

    // คลิกเพื่อเลือกผู้ชนะ (เฉพาะหน้า Admin)
    if (window.location.pathname.includes('bracket.html') && !slot.classList.contains('waiting')) {
        slot.onclick = () => {
            window.currentMatches[`match-${roundIdx}-${matchKey}`] = name;
            window.initBracket(players, window.currentMatches);
        };
    }
    return slot;
}

window.saveAndGoToBracket = async () => {
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.innerText = "⏳ บันทึก...";
    const players = Array.from(document.querySelectorAll('.playerName')).map(i => ({ name: i.value.trim() }));
    const campaignId = document.getElementById('campaignSelectSetup').value;
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
        document.getElementById('adminUrl').innerText = `${baseUrl}bracket.html?id=${docId}`;
        document.getElementById('liveUrl').innerText = `${baseUrl}live.html?id=${docId}`;
        document.getElementById('linkDisplayArea').style.display = 'block';
    } catch (e) { alert(e.message); }
    saveBtn.innerText = "💾 บันทึกสายการแข่งขัน";
};
