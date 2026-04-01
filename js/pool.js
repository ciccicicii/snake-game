// 工具函数
function lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + 
        (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + 
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + 
        (B < 255 ? B < 1 ? 0 : B : 255)
    ).toString(16).slice(1);
}

// 台球游戏物理引擎

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 游戏配置
const TABLE_MARGIN = 30; // 桌边宽度
const POCKET_RADIUS = 22; // 球袋半径
const BALL_RADIUS = 13; // 球半径
const FRICTION = 0.985; // 摩擦系数
const MIN_VELOCITY = 0.1; // 最小速度

// 球袋位置
const pockets = [
    { x: 0, y: 0 }, // 左上
    { x: 0, y: 0 }, // 左下
    { x: 0, y: 0 }, // 右上
    { x: 0, y: 0 }, // 右下
    { x: 0, y: 0 }, // 中上
    { x: 0, y: 0 }  // 中下
];

// 球的颜色
const ballColors = {
    1: '#FFD700', 2: '#0000FF', 3: '#FF0000', 4: '#800080', 
    5: '#FFA500', 6: '#008000', 7: '#800000', 8: '#000000',
    9: '#FFD700', 10: '#0000FF', 11: '#FF0000', 12: '#800080', 
    13: '#FFA500', 14: '#008000', 15: '#800000'
};

// 游戏状态
let balls = [];
let cueBall = null;
let isAiming = false;
let aimStart = { x: 0, y: 0 };
let aimEnd = { x: 0, y: 0 };
let power = 0;
let isDragging = false;
let isPlayer1Turn = true;
let player1Type = null; // 'solid' or 'stripe'
let player2Type = null;
let gamePhase = 'break'; // 'break', 'play', 'gameOver'
let score1 = 0;
let score2 = 0;

// 调整画布大小
function resizeCanvas() {
    const maxWidth = Math.min(window.innerWidth - 40, 900);
    const aspectRatio = 2; // 台球桌比例
    let width = maxWidth;
    let height = width / aspectRatio;
    
    // 如果高度超出屏幕
    if (height > window.innerHeight * 0.6) {
        height = window.innerHeight * 0.6;
        width = height * aspectRatio;
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // 更新球袋位置
    const tableWidth = width - TABLE_MARGIN * 2;
    const tableHeight = height - TABLE_MARGIN * 2;
    
    pockets[0] = { x: TABLE_MARGIN, y: TABLE_MARGIN };
    pockets[1] = { x: TABLE_MARGIN, y: height - TABLE_MARGIN };
    pockets[2] = { x: width - TABLE_MARGIN, y: TABLE_MARGIN };
    pockets[3] = { x: width - TABLE_MARGIN, y: height - TABLE_MARGIN };
    pockets[4] = { x: width / 2, y: TABLE_MARGIN };
    pockets[5] = { x: width / 2, y: height - TABLE_MARGIN };
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// 球类
class Ball {
    constructor(x, y, number) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.number = number;
        this.radius = BALL_RADIUS;
        this.isPocketed = false;
        this.isStripe = number > 8;
    }
    
    update() {
        if (this.isPocketed) return;
        
        this.x += this.vx;
        this.y += this.vy;
        
        // 摩擦力
        this.vx *= FRICTION;
        this.vy *= FRICTION;
        
        // 最小速度
        if (Math.abs(this.vx) < MIN_VELOCITY) this.vx = 0;
        if (Math.abs(this.vy) < MIN_VELOCITY) this.vy = 0;
        
        // 边界碰撞
        const margin = TABLE_MARGIN + this.radius;
        
        if (this.x < margin) {
            this.x = margin;
            this.vx = -this.vx * 0.8;
        }
        if (this.x > canvas.width - margin) {
            this.x = canvas.width - margin;
            this.vx = -this.vx * 0.8;
        }
        if (this.y < margin) {
            this.y = margin;
            this.vy = -this.vy * 0.8;
        }
        if (this.y > canvas.height - margin) {
            this.y = canvas.height - margin;
            this.vy = -this.vy * 0.8;
        }
        
        // 检测球袋
        for (const pocket of pockets) {
            const dx = this.x - pocket.x;
            const dy = this.y - pocket.y;
            if (Math.sqrt(dx * dx + dy * dy) < POCKET_RADIUS) {
                this.pocket();
            }
        }
    }
    
    pocket() {
        this.isPocketed = true;
        this.vx = 0;
        this.vy = 0;
        
        if (this.number === 8) {
            // 进黑球
            gamePhase = 'gameOver';
        }
    }
    
    draw() {
        if (this.isPocketed) return;
        
        const color = ballColors[this.number];
        
        // 球体
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        
        // 渐变效果
        const gradient = ctx.createRadialGradient(
            this.x - 3, this.y - 3, 0,
            this.x, this.y, this.radius
        );
        
        if (this.number === 8) {
            gradient.addColorStop(0, '#666');
            gradient.addColorStop(1, '#000');
        } else if (this.isStripe) {
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(1, color);
        } else {
            gradient.addColorStop(0, lightenColor(color, 50));
            gradient.addColorStop(1, color);
        }
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 条纹球的白色条纹
        if (this.isStripe) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
            
            ctx.beginPath();
            ctx.rect(this.x - this.radius, this.y - 5, this.radius * 2, 10);
            ctx.fillStyle = color;
            ctx.fill();
        }
        
        // 球号
        if (this.number !== 0) {
            ctx.fillStyle = this.number === 8 ? '#fff' : '#fff';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
            
            ctx.fillStyle = '#000';
            ctx.font = 'bold 8px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.number.toString(), this.x, this.y + 0.5);
        }
    }
    
    isMoving() {
        return Math.abs(this.vx) > MIN_VELOCITY || Math.abs(this.vy) > MIN_VELOCITY;
    }
}

// 初始化球
function initBalls() {
    balls = [];
    
    // 母球
    cueBall = new Ball(canvas.width * 0.25, canvas.height / 2, 0);
    balls.push(cueBall);
    
    // 摆放其他球（三角形）
    const startX = canvas.width * 0.7;
    const startY = canvas.height / 2;
    const spacing = BALL_RADIUS * 2.1;
    
    const rackOrder = [1, 9, 2, 10, 8, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15];
    let idx = 0;
    
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col <= row; col++) {
            const x = startX + row * spacing * Math.cos(Math.PI / 6);
            const y = startY + (col - row / 2) * spacing;
            balls.push(new Ball(x, y, rackOrder[idx]));
            idx++;
        }
    }
    
    // 确保8号球在中间
    const eightBall = balls.find(b => b.number === 8);
    const midRow = 2;
    const midCol = 1;
    const x = startX + midRow * spacing * Math.cos(Math.PI / 6);
    const y = startY + (midCol - midRow / 2) * spacing;
    eightBall.x = x;
    eightBall.y = y;
}

// 碰撞检测
function checkCollisions() {
    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
            const b1 = balls[i];
            const b2 = balls[j];
            
            if (b1.isPocketed || b2.isPocketed) continue;
            
            const dx = b2.x - b1.x;
            const dy = b2.y - b1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < BALL_RADIUS * 2) {
                // 碰撞响应
                const nx = dx / dist;
                const ny = dy / dist;
                
                // 分离重叠的球
                const overlap = BALL_RADIUS * 2 - dist;
                b1.x -= overlap * nx / 2;
                b1.y -= overlap * ny / 2;
                b2.x += overlap * nx / 2;
                b2.y += overlap * ny / 2;
                
                // 交换速度
                const dvx = b1.vx - b2.vx;
                const dvy = b1.vy - b2.vy;
                const dvDotN = dvx * nx + dvy * ny;
                
                if (dvDotN > 0) {
                    b1.vx -= dvDotN * nx;
                    b1.vy -= dvDotN * ny;
                    b2.vx += dvDotN * nx;
                    b2.vy += dvDotN * ny;
                }
            }
        }
    }
}

// 检查所有球是否停止
function allBallsStopped() {
    return balls.every(b => !b.isMoving());
}

// 绘制球袋
function drawPockets() {
    for (const pocket of pockets) {
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, POCKET_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
    }
}

// 绘制球杆
function drawCue() {
    if (!cueBall || cueBall.isPocketed || !isAiming || !allBallsStopped()) return;
    
    const dx = aimEnd.x - cueBall.x;
    const dy = aimEnd.y - cueBall.y;
    const angle = Math.atan2(dy, dx);
    
    // 预测线
    ctx.beginPath();
    ctx.moveTo(cueBall.x, cueBall.y);
    
    let testX = cueBall.x;
    let testY = cueBall.y;
    let testVX = Math.cos(angle) * 10;
    let testVY = Math.sin(angle) * 10;
    
    for (let i = 0; i < 100; i++) {
        testX += testVX;
        testY += testVY;
        
        // 边界检测
        const margin = TABLE_MARGIN + BALL_RADIUS;
        if (testX < margin || testX > canvas.width - margin ||
            testY < margin || testY > canvas.height - margin) {
            break;
        }
        
        // 球检测
        let hit = false;
        for (const ball of balls) {
            if (ball === cueBall || ball.isPocketed) continue;
            const bdx = ball.x - testX;
            const bdy = ball.y - testY;
            if (Math.sqrt(bdx * bdx + bdy * bdy) < BALL_RADIUS * 2) {
                hit = true;
                break;
            }
        }
        
        if (hit) break;
    }
    
    ctx.lineTo(testX, testY);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // 球杆
    const cueLength = 200;
    const cueDist = 20 + power * 0.5;
    
    ctx.save();
    ctx.translate(cueBall.x, cueBall.y);
    ctx.rotate(angle + Math.PI);
    
    // 球杆阴影
    ctx.beginPath();
    ctx.moveTo(cueDist, 5);
    ctx.lineTo(cueDist + cueLength, 5);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 8;
    ctx.stroke();
    
    // 球杆
    const gradient = ctx.createLinearGradient(cueDist, -4, cueDist + cueLength, -4);
    gradient.addColorStop(0, '#8B4513');
    gradient.addColorStop(0.1, '#D2691E');
    gradient.addColorStop(0.9, '#8B4513');
    gradient.addColorStop(1, '#5D3A1A');
    
    ctx.beginPath();
    ctx.moveTo(cueDist, -4);
    ctx.lineTo(cueDist + cueLength, -4);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 6;
    ctx.stroke();
    
    // 皮头
    ctx.beginPath();
    ctx.arc(cueDist, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#4ade80';
    ctx.fill();
    
    ctx.restore();
}

// 主绘制函数
function draw() {
    // 桌面
    ctx.fillStyle = '#1a472a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 桌面纹理
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 桌边
    ctx.strokeStyle = '#4a3728';
    ctx.lineWidth = TABLE_MARGIN;
    ctx.strokeRect(TABLE_MARGIN / 2, TABLE_MARGIN / 2, 
                   canvas.width - TABLE_MARGIN, canvas.height - TABLE_MARGIN);
    
    // 绘制球袋
    drawPockets();
    
    // 绘制所有球
    for (const ball of balls) {
        ball.draw();
    }
    
    // 绘制球杆
    drawCue();
    
    // 更新力量条
    document.getElementById('powerFill').style.width = (power * 100) + '%';
}

// 游戏循环
function gameLoop() {
    // 更新物理
    for (const ball of balls) {
        ball.update();
    }
    checkCollisions();
    
    // 绘制
    draw();
    
    requestAnimationFrame(gameLoop);
}

// 鼠标/触摸事件
function getEventPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if (e.touches) {
        return {
            x: (e.touches[0].clientX - rect.left) * scaleX,
            y: (e.touches[0].clientY - rect.top) * scaleY
        };
    }
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

canvas.addEventListener('mousedown', startAim);
canvas.addEventListener('touchstart', startAim, { passive: false });

canvas.addEventListener('mousemove', updateAim);
canvas.addEventListener('touchmove', updateAim, { passive: false });

canvas.addEventListener('mouseup', endAim);
canvas.addEventListener('touchend', endAim);

function startAim(e) {
    e.preventDefault();
    if (!allBallsStopped() || gamePhase === 'gameOver') return;
    if (cueBall.isPocketed) return;
    
    isDragging = true;
    isAiming = true;
    const pos = getEventPos(e);
    aimStart = pos;
    aimEnd = pos;
    power = 0;
}

function updateAim(e) {
    if (!isDragging) return;
    e.preventDefault();
    
    const pos = getEventPos(e);
    aimEnd = pos;
    
    // 计算力量
    const dx = aimStart.x - aimEnd.x;
    const dy = aimStart.y - aimEnd.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    power = Math.min(dist / 200, 1);
}

function endAim(e) {
    if (!isDragging) return;
    isDragging = false;
    
    if (power > 0.05) {
        const dx = cueBall.x - aimEnd.x;
        const dy = cueBall.y - aimEnd.y;
        const angle = Math.atan2(dy, dx);
        
        cueBall.vx = Math.cos(angle) * power * 15;
        cueBall.vy = Math.sin(angle) * power * 15;
    }
    
    isAiming = false;
    power = 0;
}

// 更新玩家信息显示
function updatePlayerInfo() {
    const p1Info = document.getElementById('player1Info');
    const p2Info = document.getElementById('player2Info');
    
    if (player1Type) {
        p1Info.className = 'player-info ' + player1Type;
        document.getElementById('player1Type').textContent = player1Type === 'solid' ? '实心球' : '条纹球';
    }
    
    if (player2Type) {
        p2Info.className = 'player-info ' + player2Type;
        document.getElementById('player2Type').textContent = player2Type === 'solid' ? '实心球' : '条纹球';
    }
}

// 初始化
initBalls();
updatePlayerInfo();
gameLoop();
