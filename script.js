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
            <input type="text" class="playerName" placeholder="พิมพ์ชื่อผู้แข่ง หรือปล่อยว่างไว้เพื่อ BYE" style="padding:10px;">
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
        
        // ค้นหาว่ามีรายการเดิมไหม ถ้ามีให้ Update แทนการสร้างใหม่
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
                createdAt: new Date() 
            });
            docId = docRef.id;
        }

        const baseUrl = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
        document.getElementById('adminUrl').innerText = `${baseUrl}bracket.html?id=${docId}`;
        document.getElementById('liveUrl').innerText = `${baseUrl}live.html`;
        document.getElementById('linkDisplayArea').style.display = 'block';
        
        alert("✅ บันทึกและอัปเดตสายการแข่งขันเรียบร้อย!");
    } catch (e) {
        alert("❌ บันทึกไม่สำเร็จ: " + e.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerText = "💾 บันทึกและอัปเดตสายการแข่งขัน";
    }
};
