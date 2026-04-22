function generateInputFields() {
    let count = parseInt(document.getElementById('playerCount').value);
    let container = document.getElementById('nameFields');
    container.innerHTML = ''; 
    
    // เพิ่มปุ่มสุ่มชื่ออัตโนมัติไว้ด้านบนของช่องกรอก
    let autoFillBtn = `<button type="button" onclick="autoFillNames(${count})" style="background:#6c757d; margin-bottom:15px; width:100%;">🪄 สุ่มชื่ออัตโนมัติสำหรับ ${count} คน</button>`;
    container.innerHTML = autoFillBtn;

    for (let i = 1; i <= count; i++) {
        container.innerHTML += `<div class="player-row"><input type="text" class="playerName" placeholder="Player ${i}"></div>`;
    }
    document.getElementById('playerInputs').style.display = 'block';
}

// ฟังก์ชันใหม่: ใส่ชื่อให้อัตโนมัติ
function autoFillNames(count) {
    let inputs = document.querySelectorAll('.playerName');
    inputs.forEach((input, index) => {
        input.value = `Player ${index + 1}`;
    });
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

let tournamentDataToSave = {};

function generateBracket() {
    let players = Array.from(document.querySelectorAll('.playerName')).map(i => i.value.trim()).filter(v => v !== "");
    if (players.length < 2) return alert("ใส่ชื่ออย่างน้อย 2 คนครับ");
    shuffleArray(players);

    let n = players.length;
    let p = Math.pow(2, Math.ceil(Math.log2(n))); 
    let byes = p - n;
    let r1_count = n - byes;

    let resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `<div class="bracket-visual" id="bracketContainer"></div>`;
    let container = document.getElementById('bracketContainer');

    // Round 1
    let r1HTML = `<div class="round"><div class="round-title">Round 1</div>`;
    for (let i = 0; i < r1_count; i += 2) {
        r1HTML += `<div class="matchup"><div class="player-slot">${players[i]}</div><div class="vs-badge">VS</div><div class="player-slot">${players[i+1]}</div></div>`;
    }
    r1HTML += `</div>`;
    container.innerHTML += r1HTML;

    // Byes / Round 2
    let byePlayers = players.slice(r1_count);
    if (byePlayers.length > 0 || r1_count > 0) {
        let r2HTML = `<div class="round"><div class="round-title">Round 2 / Byes</div>`;
        byePlayers.forEach(name => {
            r2HTML += `<div class="matchup"><div class="player-slot">${name}</div><div class="player-slot" style="color:#555"><i>Waiting...</i></div></div>`;
        });
        r2HTML += `</div>`;
        container.innerHTML += r2HTML;
    }

    tournamentDataToSave = { players, createdAt: new Date().toISOString() };
    resultDiv.style.display = "block";
    document.getElementById('saveBtn').style.display = "block";
}

async function saveToFirebase() {
    try {
        const { collection, addDoc } = window.dbFunctions;
        const docRef = await addDoc(collection(window.db, "tournaments"), tournamentDataToSave);
        alert("✅ บันทึกสำเร็จ ID: " + docRef.id);
    } catch (e) {
        alert("❌ บันทึกไม่สำเร็จ: " + e.message);
    }
}
