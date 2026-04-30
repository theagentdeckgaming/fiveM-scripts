// WinstonEMS — Vitals UI Controller

let vitalsVisible = false;

window.addEventListener('message', function(event) {
    const data = event.data;

    if (data.type === 'showVitals') {
        showVitals(data.vitals);
    } else if (data.type === 'hideVitals') {
        hideVitals();
    }
});

function showVitals(vitals) {
    const container = document.getElementById('vitals-container');
    container.classList.remove('vitals-hidden');
    container.classList.add('vitals-visible');
    vitalsVisible = true;
    
    updateVitals(vitals);
}

function hideVitals() {
    const container = document.getElementById('vitals-container');
    container.classList.remove('vitals-visible');
    container.classList.add('vitals-hidden');
    vitalsVisible = false;
}

function updateVitals(vitals) {
    // Pulse
    const pulseEl = document.getElementById('pulse-value');
    const pulseCard = document.getElementById('pulse');
    pulseEl.textContent = vitals.pulse;
    if (vitals.pulse < 50 || vitals.pulse > 140) {
        pulseCard.classList.add('pulse-critical');
    } else {
        pulseCard.classList.remove('pulse-critical');
    }

    // Blood Pressure
    const bpEl = document.getElementById('bp-value');
    const bpCard = document.getElementById('bp');
    bpEl.textContent = vitals.bp_systolic + '/' + vitals.bp_diastolic;
    if (vitals.bp_systolic < 90 || vitals.bp_systolic > 160) {
        bpCard.classList.add('pulse-critical');
    } else {
        bpCard.classList.remove('pulse-critical');
    }

    // O2
    const o2El = document.getElementById('o2-value');
    const o2Card = document.getElementById('o2');
    o2El.textContent = vitals.o2;
    if (vitals.o2 < 85) {
        o2Card.classList.add('o2-low');
    } else {
        o2Card.classList.remove('o2-low');
    }

    // Stage
    const stageNames = ['Assessing', 'Stabilizing', 'Treating', 'Transport', 'Admit'];
    const stageEl = document.getElementById('stage-value');
    stageEl.textContent = stageNames[vitals.stage - 1] || 'Unknown';
}

// Animate pulse bar when vitals update
setInterval(() => {
    if (vitalsVisible) {
        const pulseEl = document.getElementById('pulse-value');
        pulseEl.style.transform = 'scale(1.1)';
        setTimeout(() => {
            pulseEl.style.transform = 'scale(1)';
        }, 100);
    }
}, 1500);

// Close on ESC (optional NUI callback)
document.onkeydown = function(data) {
    if (data.which === 27) { // ESC
        hideVitals();
    }
};
