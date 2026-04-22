let tournamentData = { left: [], right: [] };
let finalists = { left: null, right: null };
let grandChampion = null;

// --- หน้า INDEX ---
function generateInputFields() {
    let count = parseInt(document.getElementById('playerCount').value);
    let container = document.getElementById('nameFields');
    container.innerHTML = ''; 
    document.getElementById('autoFillArea').innerHTML = `<button type="button" onclick="autoFillNames(${count})" style="background:#6c757d; padding:10px; border-radius:5px; color:white;">🪄 สุ่มชื่อตัวอย่าง</button>`;
    for (let i = 1; i <= count; i++) {
        container.innerHTML += `<div class="player-row"><input type="text" class="playerName" placeholder="${i}. ชื่อผู้แข่ง"></div>`;
    }
    document.getElementById('playerInputs').style.display = 'block';
}

function autoFillNames(count) {
    document.querySelectorAll('.playerName').forEach((input, index) => input.value = `Player ${index + 1}`);
}

async function saveAndGoToBracket() {
    let players = Array.from(document.querySelectorAll('.playerName')).map(i => i.value.trim()).filter(v => v !== "");
    if (players.length < 2) return alert("ใส่ชื่ออย่างน้อย 2 คน");
    
    for (let i = players.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [players[i], players[j]] = [players[j], players[i]];
    }
    let mid = Math.ceil(players.length / 2);

    // แก้ไขตรงนี้: ใช้ { players: ... } แทนการส่ง array ซ้อน array
    let initialData = {
        left: [{ p: players.slice(0, mid) }], 
        right: [{ p: players.slice(mid) }],
        finalists: { left: null, right: null },
        grandChampion: null,
        createdAt: new Date().toISOString()
    };

    try {
        const btn = document.getElementById('saveBtn');
        btn.innerText = "⏳ กำลังสร้างสายแข่ง...";
        const docRef = await window.dbFunctions.addDoc(window.dbFunctions.collection(window.db, "tournaments"), initialData);
        window.location.href = `bracket.html?id=${docRef.id}`;
    } catch (e) { 
        console.error(e);
        alert("❌ บันทึกไม่สำเร็จ! สาเหตุ: " + e.message); 
    }
}

// --- หน้า BRACKET ---
async function loadBracketFromFirebase() {
    const urlParams = new URLSearchParams(window.location.search);
    const tourneyId = urlParams.get('id');
    if (!tourneyId) return;

    try {
        const docSnap = await window.dbFunctions.getDoc(window.dbFunctions.doc(window.db, "tournaments", tourneyId));
        if (docSnap.exists()) {
            const data = docSnap.data();
            // ดึงข้อมูลกลับมาแปลงเป็นรูปแบบ array ที่เราใช้งาน
            tournamentData.left = data.left.map(r => r.p);
            tournamentData.right = data.right.map(r => r.p);
            finalists = data.finalists || { left: null, right: null };
            grandChampion = data.grandChampion || null;
            renderBracket();
        }
    } catch (e) { console.error(e); }
}

function renderBracket() {
    let resultDiv = document.getElementById('result');
    if (!resultDiv) return;
    resultDiv.innerHTML = `
    <div class="bracket-visual">
        <div class="side left-side" id="leftSide"></div>
        <div class="champion-area">
            <div class="champion-title">🏆 GRAND CHAMPION</div>
            <div class="grand-champion-name">${grandChampion || "???"}</div>
            <div class="final-matchup">
                <div class="player-slot" onclick="setGrandChampion('${finalists.left}')">${finalists.left || "รอฝั่งซ้าย"}</div>
                <div style="margin:5px; font-weight:bold; color:#ff4757; text-align:center;">VS</div>
                <div class="player-slot" onclick="setGrandChampion('${finalists.right}')">${finalists.right || "รอฝั่งขวา"}</div>
            </div>
        </div>
        <div class="side right-side" id="rightSide"></div>
    </div>`;
    renderSide(tournamentData.left, "leftSide", "left");
    renderSide(tournamentData.right, "rightSide", "right");
}

function renderSide(rounds, containerId, sideName) {
    let container = document.getElementById(containerId);
    rounds.forEach((roundPlayers, roundIndex) => {
        let roundHTML = `<div class="round"><div class="round-title">Round ${roundIndex + 1}</div>`;
        for (let i = 0; i < roundPlayers.length; i += 2) {
            let p1 = roundPlayers[i] || "<i>TBD</i>";
            let p2 = roundPlayers[i+1] || (roundIndex === 0 ? "<i>BYE</i>" : "<i>TBD</i>");
            roundHTML += `<div class="matchup">
                <div class="player-slot" onclick="advancePlayer('${sideName}', ${roundIndex}, '${p1}', ${Math.floor(i/2)})">${p1}</div>
                <div class="player-slot" onclick="advancePlayer('${sideName}', ${roundIndex}, '${p2}', ${Math.floor(i/2)})">${p2}</div>
            </div>`;
        }
        roundHTML += `</div>`;
        container.innerHTML += roundHTML;
    });
}

function advancePlayer(side, roundIndex, name, matchIndex) {
    if (!name || name.includes("TBD") || name.includes("BYE")) return;
    if (tournamentData[side][roundIndex].length <= 2) {
        finalists[side] = name;
    } else {
        if (!tournamentData[side][roundIndex + 1]) tournamentData[side][roundIndex + 1] = [];
        tournamentData[side][roundIndex + 1][matchIndex] = name;
    }
    renderBracket();
}

function setGrandChampion(name) {
    if (!name || name.includes("รอ")) return;
    grandChampion = name;
    renderBracket();
}

async function updateBracketData() {
    const tourneyId = new URLSearchParams(window.location.search).get('id');
    try {
        await window.dbFunctions.updateDoc(window.dbFunctions.doc(window.db, "tournaments", tourneyId), {
            left: tournamentData.left.map(r => ({ p: r })),
            right: tournamentData.right.map(r => ({ p: r })),
            finalists,
            grandChampion
        });
        alert("✅ อัปเดตความคืบหน้าการแข่งแล้ว!");
    } catch (e) { alert("Error: " + e.message); }
}

// ฟังก์ชันพิเศษสำหรับหน้า Live ของลูกค้า
window.renderLiveBracket = function(data) {
    let resultDiv = document.getElementById('result');
    if (!resultDiv) return;

    // แปลงข้อมูลกลับจากรูปแบบ Firebase Object
    const leftRounds = data.left.map(r => r.p);
    const rightRounds = data.right.map(r => r.p);
    const champion = data.grandChampion;
    const finalLeft = data.finalists.left;
    const finalRight = data.finalists.right;

    resultDiv.innerHTML = `
    <div class="bracket-visual">
        <div class="side left-side">
            ${renderRoundsStatic(leftRounds)}
        </div>
        <div class="champion-area">
            <div class="champion-title">🏆 CHAMPION</div>
            <div class="grand-champion-name">${champion || "???"}</div>
            <div class="final-matchup">
                <div class="player-slot">${finalLeft || "รอผลฝั่งซ้าย"}</div>
                <div style="margin:5px; font-weight:bold; color:#ff4757; text-align:center;">VS</div>
                <div class="player-slot">${finalRight || "รอผลฝั่งขวา"}</div>
            </div>
        </div>
        <div class="side right-side">
            ${renderRoundsStatic(rightRounds)}
        </div>
    </div>`;
};

function renderRoundsStatic(rounds) {
    return rounds.map((roundPlayers, roundIndex) => `
        <div class="round">
            <div class="round-title">Round ${roundIndex + 1}</div>
            ${renderMatchesStatic(roundPlayers, roundIndex)}
        </div>
    `).join('');
}

function renderMatchesStatic(players, roundIndex) {
    let html = '';
    for (let i = 0; i < players.length; i += 2) {
        let p1 = players[i] || "<i>TBD</i>";
        let p2 = players[i+1] || (roundIndex === 0 ? "<i>BYE</i>" : "<i>TBD</i>");
        html += `<div class="matchup">
            <div class="player-slot">${p1}</div>
            <div class="player-slot">${p2}</div>
        </div>`;
    }
    return html;
}
