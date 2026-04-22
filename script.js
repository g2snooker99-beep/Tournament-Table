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

    // แบ่งผู้เล่นเป็น 2 ฝั่ง
    let mid = Math.ceil(players.length / 2);
    let leftPlayers = players.slice(0, mid);
    let rightPlayers = players.slice(mid);

    let resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `<div class="bracket-visual">
        <div class="side left-side" id="leftSide"></div>
        <div class="champion-area">
            <div class="champion-title">🏆 CHAMPION</div>
            <div class="champion-box">FINAL WINNER</div>
        </div>
        <div class="side right-side" id="rightSide"></div>
    </div>`;

    // ฟังก์ชันช่วยสร้าง Round
    function createRound(playerList, containerId, title) {
        let sideContainer = document.getElementById(containerId);
        let roundHTML = `<div class="round"><div class="round-title">${title}</div>`;
        for (let i = 0; i < playerList.length; i += 2) {
            let p1 = playerList[i];
            let p2 = playerList[i+1] || "<i>BYE</i>";
            roundHTML += `<div class="matchup"><div class="player-slot">${p1}</div><div class="player-slot">${p2}</div></div>`;
        }
        roundHTML += `</div>`;
        sideContainer.innerHTML += roundHTML;
    }

    // สร้างสายฝั่งซ้าย
    createRound(leftPlayers, "leftSide", "Left Bracket");
    // สร้างสายฝั่งขวา
    createRound(rightPlayers, "rightSide", "Right Bracket");

    window.tournamentDataToSave = { players, createdAt: new Date().toISOString() };
    resultDiv.style.display = "block";
    document.getElementById('saveBtn').style.display = "block";
}

async function saveToFirebase() {
    try {
        const docRef = await window.dbFunctions.addDoc(window.dbFunctions.collection(window.db, "tournaments"), window.tournamentDataToSave);
        alert("✅ บันทึกเข้าฐานข้อมูล G2 เรียบร้อย! ID: " + docRef.id);
    } catch (e) {
        alert("❌ บันทึกไม่สำเร็จ: " + e.message);
    }
}
