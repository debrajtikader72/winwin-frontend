// Explicitly target your running Node.js backend port origin
// const backendUrl = "https://backend-k32p.onrender.com";
const backendUrl = "https://winwin-backend-9.onrender.com";
const targetUserId = localStorage.getItem("userId") || ""; 
const token = localStorage.getItem("token");

// Note: Top-level await requires type="module" in your script tag
// const response = await fetch(`${backendUrl}/api/user-data/${targetUserId}`, {
//     headers: {
//         'Authorization': `Bearer ${token}`
//     }
// });

if (!targetUserId) {
    alert("Session context missing. Please login again.");
    window.location.href = "login.html";
}

// 1. Initial Page Load Fetch Configuration
async function loadProfileDashboard() {
    try {
        const response = await fetch(`${backendUrl}/api/user-data/${targetUserId}`);
        if (!response.ok) throw new Error("Profile record fetch dropped");
        
        const data = await response.json();
        
        // Display user mobile identity and computational balances
        document.getElementById("display-mobile").innerText = "ID / Mobile: " + (data.mobile || "Unknown");
        document.getElementById("display-balance").innerText = Number(data.balance).toFixed(2);
        
        // Handle conditional image component mappings
        const imgEl = document.getElementById("profile-img");
        const noPhotoEl = document.getElementById("no-photo-lbl");
        
        if (data.profilePic) {
            imgEl.src = data.profilePic;
            imgEl.style.display = "block";
            noPhotoEl.style.display = "none";
        } else {
            imgEl.style.display = "none";
            noPhotoEl.style.display = "block";
        }

        // Prefill bank input nodes if context fields have strings inside MongoDB
        if (data.bankDetails) {
            document.getElementById("bank-name").value = data.bankDetails.accountName || "";
            document.getElementById("bank-acc").value = data.bankDetails.accountNumber || "";
            document.getElementById("bank-ifsc").value = data.bankDetails.ifsc || "";
        }

        // Render localized historical balance verification lists
        renderWithdrawalRecords(data.withdrawals || []);

    } catch (err) {
        console.error("Profile view network load exception error:", err);
    }
}

// 2. Base64 File Extraction Processing Handler
function uploadImage(element) {
    const file = element.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async function() {
        const base64String = reader.result;
        
        try {
            const response = await fetch(`${backendUrl}/api/upload-profile-pic`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: targetUserId, imageBase64: base64String })
            });
            
            if (response.ok) {
                loadProfileDashboard(); // Update screen profile section state
            } else {
                alert("Failed to upload photo to server database processing layer");
            }
        } catch (err) {
            console.error("Image upload pipeline crash:", err);
        }
    }
    reader.readAsDataURL(file);
}

// 3. Save User Bank Infrastructure Target Configuration
async function saveBankDetails() {
    const accountName = document.getElementById("bank-name").value;
    const accountNumber = document.getElementById("bank-acc").value;
    const ifsc = document.getElementById("bank-ifsc").value;

    try {
        const response = await fetch(`${backendUrl}/api/add-bank`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: targetUserId, accountName, accountNumber, ifsc })
        });

        const resData = await response.json();
        alert(resData.message);
    } catch (err) {
        alert("Failed to save bank configuration mapping records");
    }
}

// 4. Send Withdrawal Demand Logic
async function requestWithdrawal() {
    const amount = document.getElementById("withdraw-amount").value;
    if (!amount || amount <= 0) return alert("Please specify a real transaction extraction quantity value");

    try {
        const response = await fetch(`${backendUrl}/api/withdraw`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: targetUserId, amount })
        });

        const resData = await response.json();
        alert(resData.message);
        
        if (response.ok) {
            document.getElementById("withdraw-amount").value = "";
            loadProfileDashboard(); // Refresh matching account matrix parameters instantly
        }
    } catch (err) {
        alert("Failed to process transaction request extraction dispatch routing execution loop");
    }
}

// 5. Output Inject Table Processing Loop
function renderWithdrawalRecords(items) {
    const container = document.getElementById("withdrawal-records-list");
    container.innerHTML = "";

    if (!items || items.length === 0) {
        container.innerHTML = "<div class='no-photo'>No withdrawal transactions filed yet</div>";
        return;
    }

    // Newest withdrawal files output stacked on top
    [...items].reverse().forEach(w => {
        const row = document.createElement("div");
        row.className = "record-row";
        row.innerHTML = `
            <div>
                <div><b>₹${Number(w.amount).toFixed(2)}</b></div>
                <small style="color:#777;">${w.date}</small>
            </div>
            <div class="status-${w.status}">${w.status}</div>
        `;
        container.appendChild(row);
    });
}

// Run mapping initialization steps cleanly on startup loop
window.onload = loadProfileDashboard;
