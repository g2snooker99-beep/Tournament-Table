let tournamentData = { left: [], right: [] };
let finalists = { left: null, right: null };
let grandChampion = null;

function generateInputFields() {
    let count = parseInt(document.getElementById('playerCount').value);
    let container = document.getElementById('nameFields');
    container.innerHTML = ''; 
    document.getElementById('autoFillArea').innerHTML = `<button type="button" onclick="autoFillNames(${count})" style="background:#6c757d; padding:10px; border-radius:5px; color:white; cursor:pointer;">🪄 ใส่ชื่อตัวอย่าง ${count} คน</button>`;
    for (let i = 1; i <= count; i++) {
        container.innerHTML += `<div class="player-row"><input type="text" class="playerName" placeholder="${i}. ชื่อผู้แข่ง"></div>`;
    }
    document.getElementById('playerInputs').style.display = 'block';
}

function autoFillNames(count) {
    document.querySelectorAll('.playerName').forEach((input, index) => {
        input.value = `Player ${index + 1}`;
    });
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function generateBracket() {
    let players = Array.from(document.querySelectorAll('.playerName')).map(i => i.value.trim()).filter(v => v !== "");
    if (players.length < 2) return alert("ต้องมีผู้แข่งอย่างน้อย 2 คน");
    shuffleArray(players);

    finalists = { left: null, right: null };
    grandChampion = null;
    
    let mid = Math.ceil(players.length / 2);
    tournamentData.left = [players.slice(0, mid)];
    tournamentData.right = [players.slice(mid)];

    renderBracket();
}

function renderBracket() {
    let resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
    <div class="bracket-visual">
        <div class="side left-side" id="leftSide"></div>
        <div class="champion-area">
            <div class="champion-title">🏆 GRAND CHAMPION</div>
            <div id="grandChampionDisplay" class="grand-champion-name">${grandChampion || "???"}</div>
            <div class="final-matchup">
                <div class="round-title">ชิงชนะเลิศ</div>
                <div class="player-slot" onclick="setGrandChampion('${finalists.left}')">${finalists.left || "รอผลฝั่งซ้าย"}</div>
                <div style="text-align:center; margin:5px; font-weight:bold; color:#ff4757;">VS</div>
                <div class="player-slot" onclick="setGrandChampion('${finalists.right}')">${finalists.right || "รอผลฝั่งขวา"}</div>
            </div>
        </div>
        <div class="side right-side" id="rightSide"></div>
    </div>`;

    renderSide(tournamentData.left, "leftSide", "left");
    renderSide(tournamentData.right, "rightSide", "right");
    
    resultDiv.style.display = "block";
    document.getElementById('saveBtn').style.display = "block";
}

function renderSide(rounds, containerId, sideName) {
    let container = document.getElementById(containerId);
    rounds.forEach((roundPlayers, roundIndex) => {
        let roundHTML = `<div class="round"><div class="round-title">Round ${roundIndex + 1}</div>`;
        for (let i = 0; i < roundPlayers.length; i += 2) {
            let p1 = roundPlayers[i] || "<i>TBD</i>";
            let p2 = roundPlayers[i+1] || (roundIndex === 0 ? "<i>BYE</i>" : "<i>TBD</i>");
            
            roundHTML += `
                <div class="matchup">
                    <div class="player-slot" onclick="advancePlayer('${sideName}', ${roundIndex}, '${p1}', ${Math.floor(i/2)})">${p1}</div>
                    <div class="player-slot" onclick="advancePlayer('${sideName}', ${roundIndex}, '${p2}', ${Math.floor(i/2)})">${p2}</div>
                </div>`;
        }
        roundHTML += `</div>`;
        container.innerHTML += roundHTML;
    });
}

function advancePlayer(side, roundIndex, name, matchIndex) {
    if (name === "<i>TBD</i>" || name === "<i>BYE</i>" || name === "") return;

    let currentRoundPlayers = tournamentData[side][roundIndex];
    
    // ถ้าเป็นแมตช์สุดท้ายของฝั่งนี้ (เหลือ 1 คู่ในรอบนี้)
    if (currentRoundPlayers.length <= 2) {
        finalists[side] = name;
    } else {
        if (!tournamentData[side][roundIndex + 1]) tournamentData[side][roundIndex + 1] = [];
        tournamentData[side][roundIndex + 1][matchIndex] = name;
    }
    renderBracket();
}

function setGrandChampion(name) {
    if (!name || name.includes("รอผล")) return;
    grandChampion = name;
    renderBracket();
    alert("🎊 ขอแสดงความยินดีกับแชมป์เปี้ยน: " + name);
}

async function saveToFirebase() {
    try {
        const docRef = await window.dbFunctions.addDoc(window.dbFunctions.collection(window.db, "tournaments"), {
            finalists, grandChampion, tournamentData, createdAt: new Date().toISOString()
        });
        alert("✅ บันทึกประวัติการแข่งลง Firebase เรียบร้อย!");
    } catch (e) { alert("❌ บันทึกไม่สำเร็จ: " + e.message); }
}
