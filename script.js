// ฟังก์ชันสร้างช่องกรอกชื่อตามจำนวนคน
function generateInputFields() {
    let count = parseInt(document.getElementById('playerCount').value);
    let container = document.getElementById('nameFields');
    container.innerHTML = ''; 

    for (let i = 1; i <= count; i++) {
        container.innerHTML += `
            <div class="player-row">
                <input type="text" class="playerName" placeholder="ผู้เล่นคนที่ ${i}" required>
            </div>
        `;
    }
    document.getElementById('playerInputs').style.display = 'block';
}

// ฟังก์ชันสุ่ม Array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// ฟังก์ชันคำนวณสายแข่ง
let tournamentDataToSave = {}; // ตัวแปรเก็บข้อมูลเตรียมส่งให้ Firebase

function generateBracket() {
    let inputs = document.querySelectorAll('.playerName');
    let players = [];
    inputs.forEach(input => {
        if(input.value.trim() !== "") players.push(input.value.trim());
    });

    let n = players.length;
    if (n < 2) return alert("กรุณากรอกชื่อผู้เล่นอย่างน้อย 2 คน");

    shuffleArray(players); // สุ่มรายชื่อ

    let p = Math.pow(2, Math.ceil(Math.log2(n))); 
    let byes = p - n;
    let r1_players = n - byes;

    let html = `<h3>สรุปสายการแข่งขัน (${n} คน)</h3>`;
    html += `<p>ได้สิทธิ์ Bye (รอรอบ 2): <strong>${byes} คน</strong></p>`;
    
    let currentMatch = 1;
    let round1Matches = [];

    // จับคู่รอบแรก
    if (r1_players > 0) {
        html += `<h4>🔥 จับคู่รอบแรก (คัดเลือก)</h4>`;
        for (let i = 0; i < r1_players; i += 2) {
            html += `<div class="match-line">แมตช์ที่ ${currentMatch}: ${players[i]} 🆚 ${players[i+1]}</div>`;
            round1Matches.push(`${players[i]} VS ${players[i+1]}`);
            currentMatch++;
        }
    }

    // คนที่ได้ Bye
    let byePlayers = players.slice(r1_players);
    if (byePlayers.length > 0) {
        html += `<h4>🌟 ผู้เล่นที่ได้สิทธิ์ Bye (ยืนรอรอบถัดไป)</h4>`;
        html += `<div class="match-line">${byePlayers.join(', ')}</div>`;
    }

    // เตรียมข้อมูลลง Firebase
    tournamentDataToSave = {
        totalPlayers: n,
        bracketSize: p,
        byesCount: byes,
        round1Matches: round1Matches,
        byePlayers: byePlayers,
        createdAt: new Date().toISOString()
    };

    document.getElementById('result').innerHTML = html;
    document.getElementById('result').style.display = "block";
    document.getElementById('saveBtn').style.display = "block"; // โชว์ปุ่มเซฟ
}

// ฟังก์ชันเซฟลง Firebase (จะถูกเรียกใช้โดยเชื่อมกับ firebase-config.js)
async function saveToFirebase() {
    try {
        // ดึงตัวแปร db มาจาก global scope ที่ตั้งไว้ใน firebase-config
        const { collection, addDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        
        // สมมติว่าใน firebase-config.js คุณ export ตัวแปร db ออกมา
        const docRef = await addDoc(collection(window.db, "tournaments"), tournamentDataToSave);
        
        alert("✅ บันทึกข้อมูลสายการแข่งขันลง Firebase สำเร็จ! (ID: " + docRef.id + ")");
        document.getElementById('saveBtn').style.display = "none";
    } catch (e) {
        console.error("Error adding document: ", e);
        alert("❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล เช็ค Console ดูนะครับ");
    }
}