const backendUrl = "https://winwin-backend-9.onrender.com";
const targetUserId = localStorage.getItem("userId") || ""; 
const token = localStorage.getItem("token");

// If they are not logged in, kick them back to login page
if (!targetUserId || !token) {
    window.location.href = "login.html";
}

// 1. Initial Page Load Fetch Configuration
async function loadProfileDashboard() {
    try {
        // 1. Show a quick skeleton/loader if you have one
        
        const response = await fetch(`${backendUrl}/api/user-data/${targetUserId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error("Fetch failed");
        
        const data = await response.json();
        
        // 2. Update these instantly
        document.getElementById("display-balance").innerText = Number(data.balance).toFixed(2);
        
        // 3. Then handle the heavy stuff (history/bank) afterwards
        setTimeout(() => {
            renderWithdrawalRecords(data.withdrawals || []);
        }, 100); 

    } catch (err) {
        console.error("Load error:", err);
    }
}
// async function loadProfileDashboard() {
//     try {
//         // FIXED: Added Authorization header
//         const response = await fetch(`${backendUrl}/api/user-data/${targetUserId}`, {
//             headers: { 'Authorization': `Bearer ${token}` }
//         });
        
//         if (!response.ok) throw new Error("Profile record fetch dropped");
        
//         const data = await response.json();
        
//         document.getElementById("display-mobile").innerText = "ID / Mobile: " + (data.mobile || "Unknown");
//         document.getElementById("display-balance").innerText = Number(data.balance).toFixed(2);
        
//         const imgEl = document.getElementById("profile-img");
//         const noPhotoEl = document.getElementById("no-photo-lbl");
        
//         if (data.profilePic) {
//             imgEl.src = data.profilePic;
//             imgEl.style.display = "block";
//             noPhotoEl.style.display = "none";
//         } else {
//             imgEl.style.display = "none";
//             noPhotoEl.style.display = "block";
//         }

//         if (data.bankDetails) {
//             document.getElementById("bank-name").value = data.bankDetails.accountName || "";
//             document.getElementById("bank-acc").value = data.bankDetails.accountNumber || "";
//             document.getElementById("bank-ifsc").value = data.bankDetails.ifsc || "";
//         }

//         renderWithdrawalRecords(data.withdrawals || []);

//     } catch (err) {
//         console.error("Profile view network load exception error:", err);
//     }
// }

// 2. Base64 File Extraction Processing Handler
function uploadImage(element) {
    const file = element.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async function() {
        const base64String = reader.result;
        
        try {
            // FIXED: Added Authorization header
            const response = await fetch(`${backendUrl}/api/upload-profile-pic`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ userId: targetUserId, imageBase64: base64String })
            });
            
            if (response.ok) {
                loadProfileDashboard(); 
            } else {
                alert("Failed to upload photo");
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
        // FIXED: Added Authorization header
        const response = await fetch(`${backendUrl}/api/add-bank`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ userId: targetUserId, accountName, accountNumber, ifsc })
        });

        const resData = await response.json();
        alert(resData.message);
    } catch (err) {
        alert("Failed to save bank configuration");
    }
}

// 4. Send Withdrawal Demand Logic
async function requestWithdrawal() {
    const amount = document.getElementById("withdraw-amount").value;
    if (!amount || amount <= 0) return alert("Please enter a valid amount");

    try {
        // FIXED: Added Authorization header
        const response = await fetch(`${backendUrl}/api/withdraw`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ userId: targetUserId, amount })
        });

        const resData = await response.json();
        alert(resData.message);
        
        if (response.ok) {
            document.getElementById("withdraw-amount").value = "";
            loadProfileDashboard(); 
        }
    } catch (err) {
        alert("Failed to process transaction request");
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

// 6. LOGOUT FUNCTIONALITY
function logoutUser() {
    localStorage.clear();
    window.location.href = "login.html";
}

// Run mapping initialization steps cleanly on startup loop
window.onload = loadProfileDashboard;
