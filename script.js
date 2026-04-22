let tournamentData = { left: [], right: [] };
let finalists = { left: "", right: "" };
let grandChampion = "";

// --- ส่วนของหน้าแรก (INDEX) ---
function generateInputFields() {
    let count = parseInt(document.getElementById('playerCount').value);
    let container = document.getElementById('nameFields');
    container.innerHTML = ''; 
    document.getElementById('autoFillArea').innerHTML = `<button type="button" onclick="autoFillNames(${count})" class="btn-confirm" style="background:#6c757d; padding:10px; margin-bottom: 10px;">🪄 สุ่มชื่อตัวอย่าง</button>`;
    for (let i = 1; i <= count; i++) {
        container.innerHTML += `<div class="player-row"><input type="text" class="playerName" placeholder="${i}. ชื่อผู้แข่ง"></div>`;
    }
    document.getElementById('playerInputs').style.display = 'block';
}
window.generateInputFields = generateInputFields;

function autoFillNames(count) {
    document.querySelectorAll('.playerName').forEach((input, index) => input.value = `Player ${index + 1}`);
}
window.autoFillNames = autoFillNames;

async function saveAndGoToBracket() {
    let players = Array.from(document.querySelectorAll('.playerName')).map(i => i.value.trim()).filter(v => v !== "");
    if (players.length < 2) return alert("ใส่ชื่ออย่างน้อย 2 คน");
    
    for (let i = players.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [players[i], players[j]] = [players[j], players[i]];
    }
    
    // ปัดเศษผู้เล่นให้เต็มผัง (เช่น 14 คน ปัดเป็น 16 และเติม BYE)
    let p = Math.max(4, Math.pow(2, Math.ceil(Math.log2(players.length))));
    while(players.length < p) { players.push("BYE"); }

    let mid = p / 2;
    let leftP = players.slice(0, mid);
    let rightP = players.slice(mid);
    
    // ฟังก์ชันสร้างโครงสร้างรอบล่วงหน้าทั้งหมด
    function buildRoundsArray(initial) {
        let rounds = [initial];
        let nextSize = initial.length / 2;
        while(nextSize >= 2) {
            rounds.push(new Array(nextSize).fill(""));
            nextSize /= 2;
        }
        return rounds;
    }

    let initialData = {
        left: buildRoundsArray(leftP).map(r => ({ p: r })), 
        right: buildRoundsArray(rightP).map(r => ({ p: r })),
        finalists: { left: "", right: "" },
        grandChampion: "",
        createdAt: new Date().toISOString()
    };

    try {
        const btn = document.getElementById('saveBtn');
        btn.innerText = "⏳ กำลังบันทึกข้อมูล...";
        const docRef = await window.dbFunctions.addDoc(window.dbFunctions.collection(window.db, "tournaments"), initialData);
        
        const baseUrl = window.location.href.split('index.html')[0];
        const adminLink = `${baseUrl}bracket.html?id=${docRef.id}`;
        const liveLink = `${baseUrl}live.html`;

        document.getElementById('setupArea').style.display = 'none';
        document.getElementById('linkDisplayArea').style.display = 'block';
        document.getElementById('adminUrl').innerText = adminLink;
        document.getElementById('liveUrl').innerText = liveLink;
        
        document.getElementById('goToAdminBtn').onclick = () => window.location.href = adminLink;
    } catch (e) { 
        alert("❌ บันทึกไม่สำเร็จ: " + e.message); 
    }
}
window.saveAndGoToBracket = saveAndGoToBracket;

// --- ส่วนของการแสดงผล (ADMIN & LIVE) ---
async function loadBracketFromFirebase() {
    const tourneyId = new URLSearchParams(window.location.search).get('id');
    if (!tourneyId) return;
    try {
        const docSnap = await window.dbFunctions.getDoc(window.dbFunctions.doc(window.db, "tournaments", tourneyId));
        if (docSnap.exists()) {
            const data = docSnap.data();
            tournamentData.left = data.left.map(r => r.p);
            tournamentData.right = data.right.map(r => r.p);
            finalists = data.finalists || { left: "", right: "" };
            grandChampion = data.grandChampion || "";
            renderBracket();
        }
    } catch (e) { console.error(e); }
}
window.loadBracketFromFirebase = loadBracketFromFirebase;

function renderBracket() {
    let resultDiv = document.getElementById('result');
    if (!resultDiv) return;
    resultDiv.innerHTML = `
    <div class="bracket-visual">
        <div class="side left-side" id="leftSide"></div>
        <div class="champion-area">
            <div class="champion-title">🏆 CHAMPION</div>
            <div class="grand-champion-name">${grandChampion || "???"}</div>
            <div class="final-matchup">
                <div class="player-slot ${!finalists.left ? 'waiting' : ''}" onclick="setGrandChampion('${finalists.left}')">${finalists.left || "รอผลฝั่งซ้าย"}</div>
                <div style="margin:5px; font-weight:bold; color:#ff4757; text-align:center;">VS</div>
                <div class="player-slot ${!finalists.right ? 'waiting' : ''}" onclick="setGrandChampion('${finalists.right}')">${finalists.right || "รอผลฝั่งขวา"}</div>
            </div>
        </div>
        <div class="side right-side" id="rightSide"></div>
    </div>`;
    renderSide(tournamentData.left, "leftSide", "left");
    renderSide(tournamentData.right, "rightSide", "right");
}

function renderSide(rounds, containerId, sideName) {
    let container = document.getElementById(containerId);
    let html = "";
    rounds.forEach((roundPlayers, roundIndex) => {
        html += `<div class="round"><div class="round-title">Round ${roundIndex + 1}</div>`;
        for (let i = 0; i < roundPlayers.length; i += 2) {
            let p1 = roundPlayers[i] || "รอผลการแข่งขัน";
            let p2 = roundPlayers[i+1] || "รอผลการแข่งขัน";
            let p1Class = (p1 === "รอผลการแข่งขัน") ? "player-slot waiting" : "player-slot";
            let p2Class = (p2 === "รอผลการแข่งขัน") ? "player-slot waiting" : "player-slot";
            
            html += `<div class="matchup">
                <div class="${p1Class}" onclick="advancePlayer('${sideName}', ${roundIndex}, '${p1}', ${Math.floor(i/2)})">${p1}</div>
                <div class="${p2Class}" onclick="advancePlayer('${sideName}', ${roundIndex}, '${p2}', ${Math.floor(i/2)})">${p2}</div>
            </div>`;
        }
        html += `</div>`;
    });
    container.innerHTML = html;
}

function advancePlayer(side, roundIndex, name, matchIndex) {
    if (!name || name === "รอผลการแข่งขัน" || name === "BYE" || document.body.classList.contains("view-only")) return;
    if (roundIndex === tournamentData[side].length - 1) finalists[side] = name;
    else tournamentData[side][roundIndex + 1][matchIndex] = name;
    renderBracket();
}
window.advancePlayer = advancePlayer;

function setGrandChampion(name) {
    if (!name || name.includes("รอ") || document.body.classList.contains("view-only")) return;
    grandChampion = name;
    renderBracket();
}
window.setGrandChampion = setGrandChampion;

async function updateBracketData() {
    const tourneyId = new URLSearchParams(window.location.search).get('id');
    try {
        await window.dbFunctions.updateDoc(window.dbFunctions.doc(window.db, "tournaments", tourneyId), {
            left: tournamentData.left.map(r => ({ p: r })),
            right: tournamentData.right.map(r => ({ p: r })),
            finalists, grandChampion: grandChampion || ""
        });
        alert("✅ อัปเดตความคืบหน้าการแข่งแล้ว!");
    } catch (e) { alert("Error: " + e.message); }
}
window.updateBracketData = updateBracketData;

// --- สำหรับหน้า LIVE ลูกค้า ---
window.renderLiveBracket = function(data) {
    let resultDiv = document.getElementById('result');
    if (!resultDiv) return;
    const champion = data.grandChampion;
    const finalLeft = data.finalists.left;
    const finalRight = data.finalists.right;

    resultDiv.innerHTML = `
    <div class="bracket-visual">
        <div class="side left-side">${renderRoundsStatic(data.left.map(r => r.p))}</div>
        <div class="champion-area">
            <div class="champion-title">🏆 CHAMPION</div>
            <div class="grand-champion-name">${champion || "???"}</div>
            <div class="final-matchup">
                <div class="player-slot ${!finalLeft ? 'waiting' : ''}">${finalLeft || "รอผลฝั่งซ้าย"}</div>
                <div style="margin:5px; font-weight:bold; color:#ff4757; text-align:center;">VS</div>
                <div class="player-slot ${!finalRight ? 'waiting' : ''}">${finalRight || "รอผลฝั่งขวา"}</div>
            </div>
        </div>
        <div class="side right-side">${renderRoundsStatic(data.right.map(r => r.p))}</div>
    </div>`;
};

function renderRoundsStatic(rounds) {
    return rounds.map((roundPlayers, roundIndex) => {
        let html = `<div class="round"><div class="round-title">Round ${roundIndex + 1}</div>`;
        for (let i = 0; i < roundPlayers.length; i += 2) {
            let p1 = roundPlayers[i] || "รอผลการแข่งขัน";
            let p2 = roundPlayers[i+1] || "รอผลการแข่งขัน";
            let p1Class = (p1 === "รอผลการแข่งขัน") ? "player-slot waiting" : "player-slot";
            let p2Class = (p2 === "รอผลการแข่งขัน") ? "player-slot waiting" : "player-slot";
            html += `<div class="matchup"><div class="${p1Class}">${p1}</div><div class="${p2Class}">${p2}</div></div>`;
        }
        html += `</div>`;
        return html;
    }).join('');
}
