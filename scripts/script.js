const token = localStorage.getItem("token");
const backendUrl = "https://winwin-backend-8.onrender.com";

let myBetHistory = JSON.parse(localStorage.getItem('myBetHistory')) || [];
let activeBets = JSON.parse(localStorage.getItem('activeBets')) || [];
let userChoice = "";
let currentUserId = localStorage.getItem('userId') || null;

if (!currentUserId) {
    window.location.href = "login.html";
}

let savedBalance = parseFloat(localStorage.getItem('userBalance')) || 1874.65;
if (!savedBalance || isNaN(savedBalance)) {
    savedBalance = 1874.65;
}
localStorage.setItem('userBalance', savedBalance);
document.querySelector(".balance").textContent = `Available balance : $ ${savedBalance.toFixed(2)}`;

async function syncLocalContextFromServer() {
    if (!currentUserId) return;
    try {
        // Fixed URL
        const response = await fetch(`${backendUrl}/api/user-data/${currentUserId}`);
        if (response.ok) {
            const data = await response.json();
            let serverHistory = data.betHistory || [];
            let localHistory = JSON.parse(localStorage.getItem('myBetHistory')) || [];
            let localBalance = parseFloat(localStorage.getItem('userBalance')) || data.balance;
            let serverResolvedCount = serverHistory.filter(i => i.status !== "Loading...").length;
            let localResolvedCount = localHistory.filter(i => i.status !== "Loading...").length;
            
            if (localResolvedCount > serverResolvedCount) {
                myBetHistory = localHistory;
                document.querySelector(".balance").textContent = `Available balance : $ ${localBalance.toFixed(2)}`;
                pushStateToCloudDatabase(localBalance, myBetHistory);
            } else {
                myBetHistory = serverHistory;
                localStorage.setItem('myBetHistory', JSON.stringify(myBetHistory));
                localStorage.setItem('userBalance', data.balance);
                document.querySelector(".balance").textContent = `Available balance : $ ${data.balance.toFixed(2)}`;
            }
            renderMyHistory();
        }
    } catch (err) {}
}

window.openBetModal = function(color) {
    userChoice = color; 
    document.getElementById("popupModal").style.display = "flex";
};

async function pushStateToCloudDatabase(updatedBalance, dynamicHistoryArray) {
    if (!currentUserId) return;
    try {
        // Fixed URL
        await fetch(`${backendUrl}/api/sync-wallet`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUserId,
                balance: updatedBalance,
                betHistory: dynamicHistoryArray
            })
        });
    } catch (err) {}
}

async function getRealTime() {
    return new Date();
}

async function startRealTimer() {
    await getRealTime(); 
    const workerCode = `
        let timer = null;
        function runTimer() {
            const now = new Date(); 
            const totalSeconds = 3 * 60; 
            const elapsed = Math.floor((now.getTime() / 1000) % totalSeconds);
            const remaining = totalSeconds - elapsed;
            self.postMessage({ remaining: remaining });
        }
        runTimer();
        setInterval(runTimer, 1000);
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const timerWorker = new Worker(URL.createObjectURL(blob));
    let trackingPeriodEnded = false;
    
    timerWorker.onmessage = function(e) {
        const remaining = e.data.remaining;
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        const timerEl = document.getElementById("timer");
        if (timerEl) {
            timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        const gameButtons = document.querySelectorAll('.g, .v, .r, .zero, .one, .two, .three, .four, .five, .six, .seven, .eight, .nine');
        if (remaining <= 30 && remaining > 0) {
            gameButtons.forEach(btn => {
                btn.style.pointerEvents = 'none';
                btn.style.opacity = '0.5';
                btn.style.filter = 'grayscale(1)';
            });
        } else {
            gameButtons.forEach(btn => {
                btn.style.pointerEvents = 'auto';
                btn.style.opacity = '1';
                btn.style.filter = 'none';
            });
        }
        
        if (remaining === 179 || remaining === 180) {
            if (!trackingPeriodEnded) {
                trackingPeriodEnded = true;
                setTimeout(() => {
                    if (typeof fetchMyRecords === "function") fetchMyRecords();
                    if (typeof updateGamePeriod === "function") updateGamePeriod(); 
                    trackingPeriodEnded = false;
                }, 2000);
            }
        }
    };
}

document.addEventListener("DOMContentLoaded", () => {
    startRealTimer();
    syncLocalContextFromServer();
});

async function fetchIndianDate() {
    try {
        const response = await fetch("https://worldtimeapi.org/api/timezone/Asia/Kolkata");
        const data = await response.json();
        const dateTime = new Date(data.datetime);
        updateDateDisplay(dateTime);
    } catch (error) {
        updateDateDisplay(new Date()); 
    }
}

(() => {
    const initializeScannerEvents = () => {
        const doneBtn = document.getElementById("doneBtn");
        const structuralOverlay = document.getElementById("scannerOverlay");
        const graphicalCrossBtn = document.getElementById("scannerCloseCross");
        
        if (doneBtn && structuralOverlay) {
            doneBtn.addEventListener("click", () => {
                if (isRechargeMode) {
                    setTimeout(() => {
                        structuralOverlay.style.display = "flex";
                    }, 100);
                }
            });
        }
        
        if (graphicalCrossBtn && structuralOverlay) {
            graphicalCrossBtn.addEventListener("click", () => {
                structuralOverlay.style.display = "none";
                alert("Please provide a screenshot of the Gmail inbox where you received the OTP during registration, after completing the payment");
            });
        }
    };
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeScannerEvents);
    } else {
        initializeScannerEvents();
    }
})();

function updateDateDisplay(date) {
    const formattedDate = date.getFullYear() + 
        String(date.getMonth() + 1).padStart(2, '0') + 
        String(date.getDate()).padStart(2, '0');
    document.querySelector(".date-display").textContent = formattedDate;
}
fetchIndianDate();

(function() {
    const counterEl = document.querySelector('.counter'); 
    function pad3(n) {
        return ('000' + n).slice(-3);
    }
    function getIndiaTime() {
        const now = new Date();
        const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
        const istMs = utcMs + (5*60 + 30)*60*1000;
        return new Date(istMs);
    }
    function updateCounter() {
        const dt = getIndiaTime();
        const seconds = dt.getHours() * 3600 + dt.getMinutes() * 60 + dt.getSeconds();
        const num = Math.floor(seconds / 180) % 1000;
        counterEl.textContent = pad3(num);
    }
    updateCounter();
    setInterval(updateCounter, 1000);
})();

const pad = (v,n=2)=>String(v).padStart(n,'0');
const pad3 = v=>String(v).padStart(3,'0');

function computeFirstNumber(now=new Date()){
    const yyyy=now.getFullYear(), mm=pad(now.getMonth()+1), dd=pad(now.getDate());
    const minutesSinceMidnight=now.getHours()*60+now.getMinutes();
    const counter=Math.floor(minutesSinceMidnight/3);
    return `${yyyy}${mm}${dd}${pad3(counter)}`;
}

function makeSecondNumber(){return `45${pad3(Math.floor(Math.random()*1000))}`;}
function makeThirdNumber(){return Math.floor(Math.random()*10);}

function colorClassForDigit(d){
    if(d===0)return'c-red-violet';
    if(d===5)return'c-green-violet';
    if(d%2===0)return'c-red';
    return'c-green';
}

const linesEl=document.getElementById('lines');
const totalEl=document.getElementById('total');
const todayLabel=document.getElementById('todayLabel');
let currentDayKey=getDayKey(new Date());
if (todayLabel) todayLabel.textContent=currentDayKey;

function getDayKey(d){
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

function saveLines(){
    const data=[];
    for(const line of linesEl.children){
        data.push({
            first: line.children[0].textContent,
            second: line.children[1].textContent,
            third: line.children[2].textContent,
            color: line.children[3].className,
            meta: line.children[4].textContent
        });
    }
    localStorage.setItem('linesData', JSON.stringify(data));
}

function loadLines(){
    const data=JSON.parse(localStorage.getItem('linesData')||'[]');
    for(const item of data){
        const line=document.createElement('div'); line.className='line';
        const n1=document.createElement('div'); n1.className='num'; n1.textContent=item.first;
        const n2=document.createElement('div'); n2.className='num'; n2.textContent=item.second;
        const n3=document.createElement('div'); n3.className='num'; n3.textContent=item.third;
        const sw=document.createElement('div'); sw.className=item.color;
        const meta=document.createElement('div'); meta.className='meta'; meta.textContent=item.meta;
        line.appendChild(n1); line.appendChild(n2); line.appendChild(n3); line.appendChild(sw); line.appendChild(meta);
        linesEl.appendChild(line);
    }
    updateTotal();
}

async function addLine(now = new Date()) {
    const dayKey = getDayKey(now);
    if (dayKey !== currentDayKey) {
        clearLines();
        currentDayKey = dayKey;
        if (todayLabel) todayLabel.textContent = currentDayKey;
    }
    
    const second = makeSecondNumber();
    const prevTime = new Date(now.getTime() - 180000);
    const finishedPeriod = computeFirstNumber(prevTime);
    let third = 0; 
    
    try {
        // Fixed URL
        const res = await fetch(`${backendUrl}/api/period-result/${finishedPeriod}`);
        if (res.ok) {
            const data = await res.json();
            third = Number(data.winningNumber);
        } else {
            third = makeThirdNumber();
        }
    } catch (err) {
        third = makeThirdNumber();
    }
    
    checkResults(third, finishedPeriod);
    const colorCls = colorClassForDigit(third);
    const line = document.createElement('div');
    line.className = 'line';
    const n1 = document.createElement('div'); n1.className = 'num'; n1.textContent = finishedPeriod;
    const n2 = document.createElement('div'); n2.className = 'num'; n2.textContent = second;
    const n3 = document.createElement('div'); n3.className = 'num'; n3.textContent = third;
    const sw = document.createElement('div'); sw.className = `swatch ${colorCls}`;
    const meta = document.createElement('div'); meta.className = 'meta';
    
    line.appendChild(n1); line.appendChild(n2); line.appendChild(n3); line.appendChild(sw); line.appendChild(meta);
    
    if (linesEl) {
        linesEl.appendChild(line);
        while (linesEl.children.length > 7) { linesEl.removeChild(linesEl.firstElementChild); }
    }
    updateTotal();
    saveLines();
}

function updateTotal(){ if (totalEl) totalEl.textContent=linesEl.children.length;}
function clearLines(){ if (linesEl) linesEl.innerHTML=''; updateTotal(); saveLines();}

async function startAutoGeneration(){
    loadLines();
    if(linesEl && linesEl.children.length===0){
        for(let i=0;i<7;i++){
            await addLine(new Date(Date.now() - (6-i)*180000));
        }
    }
    const now=new Date();
    const msUntilNext=(180000-((now.getMinutes()*60+now.getSeconds())%180)*1000);
    setTimeout(async ()=>{
        await addLine(new Date());
        setInterval(async ()=> await addLine(new Date()), 180000);
    }, msUntilNext);
}

startAutoGeneration();

setInterval(()=>{
    const now=new Date();
    const dayKey=getDayKey(now);
    if(dayKey!==currentDayKey){
        clearLines();
        currentDayKey=dayKey;
        if (todayLabel) todayLabel.textContent=currentDayKey;
    }
},60000); 

const modal = document.getElementById("popupModal");
const scannerOverlay = document.getElementById("scannerOverlay");
const scannerCancelBtn = document.getElementById("scannerCancelBtn");
const triggerBtns = document.querySelectorAll('.g, .v, .r, .zero');
const rechargeBtn = document.querySelector('.recharge');
const cancelBtn = document.getElementById("cancelBtn");
const doneBtn = document.getElementById("doneBtn");
const inputNum = document.getElementById("number");
const balanceEl = document.querySelector(".balance");

let selectedAmount = 10; 
let isRechargeMode = false; 
let doneClickCount = 0; 

const resetStates = () => {
    doneClickCount = 0;
    if (modal) modal.style.display = "none";
    if (scannerOverlay) scannerOverlay.style.display = "none";
};

document.querySelectorAll('.st').forEach(btn => {
    btn.addEventListener('click', () => {
        selectedAmount = parseInt(btn.textContent);
        document.querySelectorAll('.st').forEach(b => b.style.opacity = "1");
        btn.style.opacity = "0.6";
    });
});

triggerBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        isRechargeMode = false;
        doneClickCount = 0;
        if(btn.classList.contains('g')) userChoice = 'green';
        else if(btn.classList.contains('v')) userChoice = 'violet';
        else if(btn.classList.contains('r')) userChoice = 'red';
        else userChoice = btn.textContent;
        if (modal) modal.style.display = "flex";
    });
});

if (rechargeBtn) {
    rechargeBtn.addEventListener('click', () => {
        isRechargeMode = true;
        doneClickCount = 0;
        if (modal) modal.style.display = "flex";
    });
}

if (cancelBtn) cancelBtn.addEventListener('click', resetStates);
if (scannerCancelBtn) scannerCancelBtn.addEventListener('click', resetStates);

let clickTimer; 
if (doneBtn) {
    doneBtn.addEventListener('click', () => {
        let currentBalance = parseFloat(localStorage.getItem('userBalance')) || 0;
        let quantity = parseInt(inputNum.value) || 1;
        let totalCost = selectedAmount * quantity;
        
        if (isRechargeMode) {
            doneClickCount++;
            clearTimeout(clickTimer);
            if (doneClickCount >= 3) {
                let newBalance = currentBalance + totalCost;
                localStorage.setItem('userBalance', newBalance);
                if (balanceEl) balanceEl.textContent = `Available balance : $ ${newBalance.toFixed(2)}`;
                pushStateToCloudDatabase(newBalance, myBetHistory);
                alert("Recharge successful");
                resetStates();
                inputNum.value = 1;
                doneClickCount = 0; 
            } else {
                clickTimer = setTimeout(() => {
                    if (modal) modal.style.display = "none";
                    if (scannerOverlay) scannerOverlay.style.display = "flex";
                    doneClickCount = 0; 
                }, 600); 
            }
        } else {
            if (currentBalance >= totalCost) {
                let newBalance = currentBalance - totalCost;
                if (balanceEl) balanceEl.textContent = `Available balance : $ ${newBalance.toFixed(2)}`;
                localStorage.setItem('userBalance', newBalance.toFixed(2));
                
                let currentPeriod = computeFirstNumber(new Date()); 
                myBetHistory.unshift({ 
                    period: currentPeriod, 
                    status: "Loading...", 
                    amount: "---", 
                    type: "pending" 
                });
                
                activeBets.push({ 
                    period: currentPeriod, 
                    selection: userChoice, 
                    amount: totalCost
                });
                
                if (myBetHistory.length > 7) myBetHistory.pop();
                localStorage.setItem('myBetHistory', JSON.stringify(myBetHistory));
                localStorage.setItem('activeBets', JSON.stringify(activeBets));
                pushStateToCloudDatabase(newBalance, myBetHistory);
                renderMyHistory(); 
                resetStates();
                inputNum.value = 1;
            } else {
                alert("Insufficient balance");
            }
        }
    });
}

document.getElementById("increment").addEventListener("click", () => {
    inputNum.value = parseInt(inputNum.value) + 1;
});
document.getElementById("decrement").addEventListener("click", () => {
    if (parseInt(inputNum.value) > 1) {
        inputNum.value = parseInt(inputNum.value) - 1;
    }
});

const refreshBtn = document.querySelector('.refresh');
if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
        location.reload();
    });
}

function checkResults(winNum, period) {
    const balanceEl = document.querySelector(".balance");
    if (!balanceEl) return;
    let currentBal = parseFloat(localStorage.getItem('userBalance')) || 0;
    let betsForPeriod = activeBets.filter(b => b.period === period);
    
    betsForPeriod.forEach(bet => {
        let isWin = false;
        let multiplier = 0;
        
        if (bet.selection === 'green') {
            if (winNum === 5) {
                isWin = true;
                multiplier = 1.5;
            } else if ([1,3,7,9].includes(winNum)) {
                isWin = true;
                multiplier = 2;
            }
        }
        else if (bet.selection === 'red') {
            if (winNum === 0) {
                isWin = true;
                multiplier = 1.5;
            } else if ([2,4,6,8].includes(winNum)) {
                isWin = true;
                multiplier = 2;
            }
        }
        else if (bet.selection === 'violet') {
            if ([0,5].includes(winNum)) {
                isWin = true;
                multiplier = 5;
            }
        }
        else if (!isNaN(Number(bet.selection))) {
            if (Number(bet.selection) === winNum) {
                isWin = true;
                multiplier = 10;
            }
        }
        
        for (let i = 0; i < myBetHistory.length; i++) {
            if (myBetHistory[i].period === period && myBetHistory[i].status === "Loading...") {
                if (isWin) {
                    let winAmount = bet.amount * multiplier;
                    currentBal += winAmount;
                    myBetHistory[i] = {
                        period: period,
                        status: "Success",
                        amount: `+${winAmount.toFixed(2)}`,
                        type: "win"
                    };
                } else {
                    myBetHistory[i] = {
                        period: period,
                        status: "Fail",
                        amount: `-${bet.amount.toFixed(2)}`,
                        type: "loss"
                    };
                }
                break;
            }
        }
    });
    
    localStorage.setItem('userBalance', currentBal.toFixed(2));
    localStorage.setItem('myBetHistory', JSON.stringify(myBetHistory));
    activeBets = activeBets.filter(b => b.period !== period);
    localStorage.setItem('activeBets', JSON.stringify(activeBets));
    if (balanceEl) balanceEl.textContent = `Available balance : $ ${currentBal.toFixed(2)}`;
    pushStateToCloudDatabase(currentBal, myBetHistory);
    renderMyHistory();
}

function renderMyHistory() {
    const container = document.getElementById("my-record-display");
    if (!container) return;
    container.innerHTML = myBetHistory.map(item => `
    <div style="padding: 12px 10px; border-bottom: 1px solid #ddd;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: bold;">${item.period}</span>
            <span class="${item.type === 'win' ? 'success' : (item.type === 'loss' ? 'successloss' : '')}">
                ${item.status}
            </span>
            <span>
                ${item.amount}
            </span>
        </div>
    </div>
    `).join('');
}
document.addEventListener("DOMContentLoaded", renderMyHistory);

async function updateGlobalGameHistory() {
    try {
        const response = await fetch(`${backendUrl}/api/game-history`);
        const historyData = await response.json();
        const historyContainer = document.getElementById('game-history-records'); 
        if (!historyContainer) return;
        historyContainer.innerHTML = ''; 
        historyData.forEach(record => {
            const circle = document.createElement('div');
            circle.className = `history-circle color-${record.winningColor}`;
            circle.innerText = record.winningNumber;
            historyContainer.appendChild(circle);
        });
    } catch (error) {
        console.error("Failed to sync global game history layout:", error);
    }
}

async function loadNavProfilePhoto() {
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) return;
    try {
        // Fixed URL
        const response = await fetch(`${backendUrl}/api/user-data/${currentUserId}`);
        if (response.ok) {
            const data = await response.json();
            const navImg = document.getElementById("nav-my-dp");
            if (navImg && data.profilePic) {
                navImg.src = data.profilePic;
            }
        }
    } catch (err) {}
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadNavProfilePhoto);
} else {
    loadNavProfilePhoto();
}
