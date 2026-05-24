const backendUrl = "https://winwin-backend-4.onrender.com";

const targetUserId = localStorage.getItem("userId");
const token = localStorage.getItem("token");

if (!targetUserId || !token) {
    alert("Session expired. Please login again.");
    window.location.href = "login.html";
}

// Load Profile
async function loadProfileDashboard() {
    try {
        const response = await fetch(`${backendUrl}/api/user-data/${targetUserId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error("Failed to fetch profile");

        const data = await response.json();

        document.getElementById("display-mobile").innerText =
            "ID / Mobile: " + (data.mobile || "Unknown");

        document.getElementById("display-balance").innerText =
            Number(data.balance || 0).toFixed(2);

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

        if (data.bankDetails) {
            document.getElementById("bank-name").value = data.bankDetails.accountName || "";
            document.getElementById("bank-acc").value = data.bankDetails.accountNumber || "";
            document.getElementById("bank-ifsc").value = data.bankDetails.ifsc || "";
        }

        renderWithdrawalRecords(data.withdrawals || []);

    } catch (err) {
        console.error("Profile load error:", err);
    }
}

// Upload Profile Pic
function uploadImage(element) {
    const file = element.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async function () {
        try {
            const response = await fetch(`${backendUrl}/api/upload-profile-pic`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: targetUserId,
                    imageBase64: reader.result
                })
            });

            if (response.ok) {
                loadProfileDashboard();
            } else {
                alert("Upload failed");
            }

        } catch (err) {
            console.error("Upload error:", err);
        }
    };

    reader.readAsDataURL(file);
}

// Save Bank Details
async function saveBankDetails() {
    const accountName = document.getElementById("bank-name").value;
    const accountNumber = document.getElementById("bank-acc").value;
    const ifsc = document.getElementById("bank-ifsc").value;

    try {
        const response = await fetch(`${backendUrl}/api/add-bank`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                userId: targetUserId,
                accountName,
                accountNumber,
                ifsc
            })
        });

        const res = await response.json();
        alert(res.message);

    } catch (err) {
        alert("Failed to save bank details");
    }
}

// Withdrawal
async function requestWithdrawal() {
    const amount = document.getElementById("withdraw-amount").value;

    if (!amount || amount <= 0) {
        return alert("Enter valid amount");
    }

    try {
        const response = await fetch(`${backendUrl}/api/withdraw`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                userId: targetUserId,
                amount
            })
        });

        const res = await response.json();
        alert(res.message);

        if (response.ok) {
            loadProfileDashboard();
        }

    } catch (err) {
        alert("Withdrawal failed");
    }
}

// Render Withdraw History
function renderWithdrawalRecords(items) {
    const container = document.getElementById("withdrawal-records-list");
    container.innerHTML = "";

    if (!items.length) {
        container.innerHTML = "<div>No withdrawals yet</div>";
        return;
    }

    items.reverse().forEach(w => {
        const row = document.createElement("div");
        row.innerHTML = `
            <div>
                ₹${Number(w.amount).toFixed(2)} - ${w.status}
            </div>
        `;
        container.appendChild(row);
    });
}

window.onload = loadProfileDashboard;
