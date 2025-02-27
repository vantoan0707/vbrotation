const canvas = document.getElementById('court');
const ctx = canvas.getContext('2d');

const courtWidth = canvas.width;  // 600px
const courtHeight = canvas.height; // 400px

// Scale: 9m width = 600px, 9m height = 400px
const metersToPixelsX = courtWidth / 9;  // ≈66.67px per meter
const metersToPixelsY = courtHeight / 9; // ≈44.44px per meter
const centerLine = 3 * metersToPixelsY;  // 3m line at 133.33px

const playerRadius = 35; // Adjustable player size

// Players: index maps to position (0=2, 1=3, 2=4, 3=5, 4=6, 5=1)
let players = [
    { x: 6 * metersToPixelsX, y: 2 * metersToPixelsY, label: 'OH1', pos: 2 },
    { x: 4.5 * metersToPixelsX, y: 2 * metersToPixelsY, label: 'MB1', pos: 3 },
    { x: 3 * metersToPixelsX, y: 2 * metersToPixelsY, label: 'OP', pos: 4 },
    { x: 3 * metersToPixelsX, y: 7 * metersToPixelsY, label: 'OH2', pos: 5 },
    { x: 4.5 * metersToPixelsX, y: 7 * metersToPixelsY, label: 'MB2', pos: 6 },
    { x: 6 * metersToPixelsX, y: 7 * metersToPixelsY, label: 'Setter', pos: 1 }
];

let initialPositions = players.map(p => ({ x: p.x, y: p.y, label: p.label, pos: p.pos })); // Store initial positions
let rotatedPositions = players.map(p => ({ x: p.x, y: p.y, label: p.label, pos: p.pos })); // Store positions after rotation

function drawCourt() {
    ctx.clearRect(0, 0, courtWidth, courtHeight);
    
    ctx.beginPath();
    ctx.moveTo(0, centerLine);
    ctx.lineTo(courtWidth, centerLine);
    ctx.strokeStyle = '#fff'; // Set the color to white
    ctx.lineWidth = 5;
    ctx.stroke();
}

function drawPlayers() {
    players.forEach(player => {
        ctx.beginPath();
        ctx.arc(player.x, player.y, playerRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#3498db';
        ctx.fill();
        ctx.closePath();

        ctx.fillStyle = '#fff';
        ctx.font = `${playerRadius * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(player.label, player.x, player.y + (playerRadius * 0.2));
    });
}

function rotate() {
    const duration = 1000; // Animation duration in ms (1 second)
    const startTime = performance.now();
    const startPositions = players.map(p => ({ x: p.x, y: p.y, pos: p.pos })); // Capture current positions

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1); // 0 to 1

        // Interpolate positions
        players.forEach((player, index) => {
            const prevIndex = (index - 1 + players.length) % players.length;
            const startX = startPositions[index].x;
            const startY = startPositions[index].y;
            const endX = startPositions[prevIndex].x;
            const endY = startPositions[prevIndex].y;

            player.x = startX + (endX - startX) * progress;
            player.y = startY + (endY - startY) * progress;
        });

        drawCourt();
        drawPlayers();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Update players' positions and pos property to the final positions after the animation completes
            players.forEach((player, index) => {
                const prevIndex = (index - 1 + players.length) % players.length;
                player.x = startPositions[prevIndex].x;
                player.y = startPositions[prevIndex].y;
                player.pos = startPositions[prevIndex].pos;
            });
            rotatedPositions = players.map(p => ({ x: p.x, y: p.y, label: p.label, pos: p.pos })); // Store the new positions
        }
    }

    requestAnimationFrame(animate);
}

function animateReorganize() {
    const duration = 1000; // Animation duration in ms (1 second)
    const startTime = performance.now();
    const startPositions = players.map(p => ({ x: p.x, y: p.y, pos: p.pos })); // Capture current positions

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1); // 0 to 1

        // Interpolate positions
        players.forEach((player, index) => {
            const startX = startPositions[index].x;
            const startY = startPositions[index].y;
            const endX = rotatedPositions[index].x;
            const endY = rotatedPositions[index].y;

            player.x = startX + (endX - startX) * progress;
            player.y = startY + (endY - startY) * progress;
        });

        drawCourt();
        drawPlayers();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Ensure final positions are set
            players.forEach((player, index) => {
                player.x = rotatedPositions[index].x;
                player.y = rotatedPositions[index].y;
                player.pos = rotatedPositions[index].pos;
            });
        }
    }

    requestAnimationFrame(animate);
}

function reorganize() {
    animateReorganize();
}

function updateName(index, newName) {
    players[index].label = newName || players[index].label;
    drawCourt();
    drawPlayers();
}

function checkPositionalFault() {
    const frontRow = players.filter(p => [2, 3, 4].includes(p.pos));
    const backRow = players.filter(p => [1, 5, 6].includes(p.pos));

    const pairs = [
        { front: 2, back: 1 },
        { front: 3, back: 6 },
        { front: 4, back: 5 }
    ];

    for (const pair of pairs) {
        const frontPlayer = frontRow.find(p => p.pos === pair.front);
        const backPlayer = backRow.find(p => p.pos === pair.back);
        if (frontPlayer.y >= backPlayer.y) {
            return `Positional Fault (7.4.2.1): Player ${frontPlayer.label} (Pos ${pair.front}) must be above Player ${backPlayer.label} (Pos ${pair.back}).`;
        }
    }

    const pos4 = frontRow.find(p => p.pos === 4);
    const pos3 = frontRow.find(p => p.pos === 3);
    const pos2 = frontRow.find(p => p.pos === 2);
    if (pos4.x >= pos3.x || pos3.x >= pos2.x) {
        return "Positional Fault (7.4.2.2): Front-row order must be 4 (left) < 3 < 2 (right).";
    }

    const pos5 = backRow.find(p => p.pos === 5);
    const pos6 = backRow.find(p => p.pos === 6);
    const pos1 = backRow.find(p => p.pos === 1);
    if (pos5.x >= pos6.x || pos6.x >= pos1.x) {
        return "Positional Fault (7.4.2.2): Back-row order must be 5 (left) < 6 < 1 (right).";
    }

    return null;
}

// Dragging logic
let selectedPlayer = null;

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    players.forEach((player, index) => {
        const dx = mouseX - player.x;
        const dy = mouseY - player.y;
        if (Math.sqrt(dx * dx + dy * dy) < playerRadius) {
            selectedPlayer = index;
        }
    });
});

canvas.addEventListener('mousemove', (e) => {
    if (selectedPlayer !== null) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        players[selectedPlayer].x = Math.max(playerRadius, Math.min(courtWidth - playerRadius, mouseX));
        players[selectedPlayer].y = Math.max(playerRadius, Math.min(courtHeight - playerRadius, mouseY));

        drawCourt();
        drawPlayers();
    }
});

canvas.addEventListener('mouseup', () => {
    if (selectedPlayer !== null) {
        const fault = checkPositionalFault();
        if (fault) {
            alert(fault);
        }
        selectedPlayer = null;
    }
});

canvas.addEventListener('dblclick', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    players.forEach((player, index) => {
        const dx = mouseX - player.x;
        const dy = mouseY - player.y;
        if (Math.sqrt(dx * dx + dy * dy) < playerRadius) {
            const newName = prompt("Enter new name for the player:", player.label);
            if (newName) {
                updateName(index, newName);
            }
        }
    });
});

// Initial draw
drawCourt();
drawPlayers();