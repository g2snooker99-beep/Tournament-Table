let tournamentData = {
    left: [],
    right: []
};

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

// ฟังก์ชันหลักในการสร้างผัง
function generateBracket() {
    let players = Array.from(document.querySelectorAll('.playerName')).map(i => i.value.trim()).filter(v => v !== "");
    if (players.length < 2) return alert("ต้องมีผู้แข่งอย่างน้อย 2 คน");
    shuffleArray(players);

    let mid = Math.ceil(players.length / 2);
    tournamentData.left = [players.slice(0, mid)]; // รอบแรกฝั่งซ้าย
    tournamentData.right = [players.slice(mid)];   // รอบแรกฝั่งขวา

    renderBracket();
}

// ฟังก์ชันวาดผังใหม่ทุกครั้งที่มีการเปลี่ยนผู้ชนะ
function renderBracket() {
    let resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `<div class="bracket-visual">
        <div class="side left-side" id="leftSide"></div>
        <div class="champion-area">
            <div class="champion-title">🏆 CHAMPION</div>
            <div id="finalWinner" class="champion-box">รอผลชิงชนะเลิศ</div>
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
        let roundHTML = `<div class="round"><div class="round-title">รอบที่ ${roundIndex + 1}</div>`;
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

// ฟังก์ชันหัวใจ: คลิกที่ชื่อคนชนะ เพื่อให้คนนั้นไปโผล่ในรอบถัดไป
function advancePlayer(side, roundIndex, name, matchIndex) {
    if (name === "<i>TBD</i>" || name === "<i>BYE</i>") return;

    // เตรียมพื้นที่สำหรับรอบถัดไปถ้ายังไม่มี
    if (!tournamentData[side][roundIndex + 1]) {
        tournamentData[side][roundIndex + 1] = [];
    }

    // ใส่ชื่อผู้ชนะลงใน match ถัดไปของรอบถัดไป
    tournamentData[side][roundIndex + 1][matchIndex] = name;

    // ถ้าชนะในรอบสุดท้ายของฝั่งตัวเองแล้ว ให้ส่งไปที่ Champion Box
    // สมมติว่ามี 4 รอบ (ขึ้นอยู่กับจำนวนคน)
    // สำหรับการทดสอบเบื้องต้น ถ้าไม่มีคนชนะคู่กันในรอบนั้นแล้ว ให้ถือเป็นผู้เข้าชิง
    checkFinalist();
    
    renderBracket(); // วาดใหม่เพื่อโชว์ผล
}

function checkFinalist() {
    // ระบบจะเช็คว่าใครคือคนสุดท้ายของแต่ละฝั่ง
    // ฟังก์ชันนี้สามารถพัฒนาต่อให้เช็คการเจอกันตรงกลางได้
}

async function saveToFirebase() {
    try {
        const docRef = await window.dbFunctions.addDoc(window.dbFunctions.collection(window.db, "tournaments"), {
            bracket: tournamentData,
            createdAt: new Date().toISOString()
        });
        alert("✅ บันทึกสายการแข่งขันปัจจุบันเรียบร้อย!");
    } catch (e) { alert("❌ บันทึกไม่สำเร็จ: " + e.message); }
}
