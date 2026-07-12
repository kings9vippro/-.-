const express = require('express');
const axios = require('axios');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.use(express.json({ limit: '32kb' }));

const PORT = process.env.PORT || 10000;
const API_URL_HU = 'https://wtx.tele68.com/v1/tx/sessions';
const API_URL_MD5 = 'https://wtxmd52.tele68.com/v1/txmd5/sessions';

// ═══════════════ AUTH ═══════════════
const MASTER_KEY = crypto.randomBytes(4).toString('hex');
const TOKEN_STORE = new Map();
const MASTER_TOKEN = crypto.randomBytes(32).toString('hex');
TOKEN_STORE.set(MASTER_TOKEN, { role: 'admin', created: Date.now(), permanent: true });

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ═══════════════ ZALO ĐẠI CA ═══════════════
const ZALO_DAICA = '0347674021';
const DAICA_NAME = 'ANH KHÔI';

console.log('\n╔══════════════════════════════════════════╗');
console.log('║   👑 ANH KHOI SIÊU VIP ELITE v13.0     ║');
console.log('║   "Phân tích độc quyền - Chuẩn xác"    ║');
console.log('╠══════════════════════════════════════════╣');
console.log('║   Mã truy cập: ' + MASTER_KEY + '                  ║');
console.log('║   Port: ' + PORT + '                       ║');
console.log('║   Zalo Đại Ca: ' + ZALO_DAICA + '            ║');
console.log('╚══════════════════════════════════════════╝\n');

// ═══════════════════════════════════════════
// SIÊU VIP ELITE PREDICTOR - PHÂN TÍCH ĐỘC QUYỀN
// ═══════════════════════════════════════════
class SieuVipElitePredictor {
    constructor(sanhType) {
        this.sanhType = sanhType;
        this.stats = { total: 0, correct: 0, wrong: 0, streak: 0 };
        this.predictionCache = [];
        this.lastSession = null;
        this.consecutiveLoss = 0;
        this.lastPrediction = null;
        this.confidenceHistory = [];
    }

    // Phân tích chuyên sâu đa tầng
    analyzeDeep(history) {
        if (!history || history.length < 3) {
            return { prediction: '...', confidence: 0, ready: false, reason: 'Đang thu thập dữ liệu...' };
        }

        const results = history.map(h => h.result === 'Tài' ? 'T' : 'X');
        const totals = history.map(h => h.totalScore || 10.5);
        const dices = history.map(h => ({ d1: h.d1 || 0, d2: h.d2 || 0, d3: h.d3 || 0 }));

        // ═══════════ PHÂN TÍCH ĐA TẦNG ═══════════
        const totalSessions = results.length;
        const lastResult = results[0];
        const lastTotal = totals[0];

        // Đếm T/X các khung thời gian
        const khung5 = results.slice(0, Math.min(5, totalSessions));
        const khung7 = results.slice(0, Math.min(7, totalSessions));
        const khung10 = results.slice(0, Math.min(10, totalSessions));
        const khung15 = results.slice(0, Math.min(15, totalSessions));
        const khung20 = results.slice(0, Math.min(20, totalSessions));

        const t5 = khung5.filter(r => r === 'T').length;
        const t7 = khung7.filter(r => r === 'T').length;
        const t10 = khung10.filter(r => r === 'T').length;
        const t15 = khung15.filter(r => r === 'T').length;
        const t20 = khung20.filter(r => r === 'T').length;

        const x5 = khung5.length - t5;
        const x7 = khung7.length - t7;
        const x10 = khung10.length - t10;
        const x15 = khung15.length - t15;
        const x20 = khung20.length - t20;

        // Streak hiện tại
        let currentStreak = 1;
        for (let i = 1; i < results.length; i++) {
            if (results[i] === results[0]) currentStreak++;
            else break;
        }
        const trendDirection = results[0];

        // Streak dài nhất
        let maxStreak = 1;
        let tempStreak = 1;
        for (let i = 1; i < results.length; i++) {
            if (results[i] === results[i - 1]) tempStreak++;
            else { maxStreak = Math.max(maxStreak, tempStreak);
                tempStreak = 1; }
        }
        maxStreak = Math.max(maxStreak, tempStreak, currentStreak);

        // Phân tích tổng điểm
        const avg3 = totals.slice(0, Math.min(3, totals.length)).reduce((a, b) => a + b, 0) / Math.min(3, totals.length);
        const avg5 = totals.slice(0, Math.min(5, totals.length)).reduce((a, b) => a + b, 0) / Math.min(5, totals.length);
        const avg7 = totals.slice(0, Math.min(7, totals.length)).reduce((a, b) => a + b, 0) / Math.min(7, totals.length);
        const avg10 = totals.slice(0, Math.min(10, totals.length)).reduce((a, b) => a + b, 0) / Math.min(10, totals
            .length);

        // MA Crossover nâng cao
        const maCrossover = avg3 - avg7;
        const maTrend = avg5 - avg10;

        // Phát hiện xen kẽ (đảo chiều liên tục)
        let alternatingCount = 0;
        for (let i = 1; i < Math.min(results.length, 6); i++) {
            if (results[i] !== results[i - 1]) alternatingCount++;
        }
        const isAlternating = alternatingCount >= 3;

        // Phát hiện cầu bệt (chuỗi dài)
        const isBet = currentStreak >= 4;

        // ═══════════ TÍNH ĐIỂM PHÂN TÍCH ═══════════
        let scoreT = 0;
        let scoreX = 0;
        let analysisReasons = [];

        // 1. Phân tích dây (Streak Analysis)
        if (currentStreak >= 8) {
            if (trendDirection === 'T') { scoreX += 5;
                analysisReasons.push(`Dây Tài ${currentStreak} phiên - Khả năng gãy cao`); } else { scoreT += 5;
                analysisReasons.push(`Dây Xỉu ${currentStreak} phiên - Khả năng gãy cao`); }
        } else if (currentStreak >= 6) {
            if (trendDirection === 'T') { scoreX += 4;
                analysisReasons.push(`Dây Tài ${currentStreak} phiên - Cảnh báo đảo chiều`); } else { scoreT += 4;
                analysisReasons.push(`Dây Xỉu ${currentStreak} phiên - Cảnh báo đảo chiều`); }
        } else if (currentStreak >= 4) {
            if (trendDirection === 'T') { scoreX += 2.5;
                analysisReasons.push(`Dây Tài ${currentStreak} - Áp lực đảo chiều`); } else { scoreT += 2.5;
                analysisReasons.push(`Dây Xỉu ${currentStreak} - Áp lực đảo chiều`); }
        } else if (currentStreak >= 2 && this.sanhType === 'hu') {
            if (trendDirection === 'T') { scoreT += 1.5;
                analysisReasons.push('Theo xu hướng Tài Hũ'); } else { scoreX += 1.5;
                analysisReasons.push('Theo xu hướng Xỉu Hũ'); }
        }

        // 2. Phân tích cân bằng (Balance Analysis)
        if (t10 >= 8 && t10 <= 10) { scoreX += 4;
            analysisReasons.push(`10 phiên: ${t10}T/${x10}X - Mất cân bằng Tài`); }
        if (x10 >= 8 && x10 <= 10) { scoreT += 4;
            analysisReasons.push(`10 phiên: ${t10}T/${x10}X - Mất cân bằng Xỉu`); }
        if (t15 >= 11) { scoreX += 3.5;
            analysisReasons.push(`15 phiên lệch Tài (${t15}T)`); }
        if (x15 >= 11) { scoreT += 3.5;
            analysisReasons.push(`15 phiên lệch Xỉu (${x15}X)`); }
        if (t20 >= 14) { scoreX += 2.5;
            analysisReasons.push(`20 phiên quá nhiều Tài`); }
        if (x20 >= 14) { scoreT += 2.5;
            analysisReasons.push(`20 phiên quá nhiều Xỉu`); }

        // 3. Phân tích tổng điểm (Total Score Analysis)
        if (lastTotal >= 17) { scoreX += 4.5;
            analysisReasons.push(`Tổng điểm cực cao (${lastTotal})`); } else if (lastTotal >= 15) { scoreX += 2.5;
            analysisReasons.push(`Tổng điểm cao (${lastTotal})`); } else if (lastTotal >= 13) { scoreX += 1.5;
            analysisReasons.push(`Tổng điểm khá cao (${lastTotal})`); }

        if (lastTotal <= 4) { scoreT += 4.5;
            analysisReasons.push(`Tổng điểm cực thấp (${lastTotal})`); } else if (lastTotal <= 6) { scoreT += 2.5;
            analysisReasons.push(`Tổng điểm thấp (${lastTotal})`); } else if (lastTotal <= 8) { scoreT += 1.5;
            analysisReasons.push(`Tổng điểm khá thấp (${lastTotal})`); }

        // 4. MA Crossover nâng cao
        if (maCrossover > 2.5) { scoreX += 3;
            analysisReasons.push('MA ngắn hạn tăng mạnh'); } else if (maCrossover > 1.5) { scoreX += 1.5;
            analysisReasons.push('MA ngắn hạn tăng nhẹ'); }

        if (maCrossover < -2.5) { scoreT += 3;
            analysisReasons.push('MA ngắn hạn giảm mạnh'); } else if (maCrossover < -1.5) { scoreT += 1.5;
            analysisReasons.push('MA ngắn hạn giảm nhẹ'); }

        // 5. Xu hướng MA dài hạn
        if (maTrend > 2) { scoreX += 2;
            analysisReasons.push('Xu hướng dài hạn tăng'); }
        if (maTrend < -2) { scoreT += 2;
            analysisReasons.push('Xu hướng dài hạn giảm'); }

        // 6. Phân tích xen kẽ
        if (isAlternating && results.length >= 5) {
            const nextPred = results[0] === 'T' ? 'X' : 'T';
            if (nextPred === 'T') { scoreT += 2;
                analysisReasons.push('Chuỗi xen kẽ - Dự đoán Tài'); } else { scoreX += 2;
                analysisReasons.push('Chuỗi xen kẽ - Dự đoán Xỉu'); }
        }

        // 7. Phân tích ngắn hạn (5 phiên gần nhất)
        if (t5 <= 1) { scoreT += 2;
            analysisReasons.push(`5 phiên gần nhất: ${t5}T/${x5}X - Thiếu Tài`); }
        if (x5 <= 1) { scoreX += 2;
            analysisReasons.push(`5 phiên gần nhất: ${t5}T/${x5}X - Thiếu Xỉu`); }

        // 8. Cân bằng tự nhiên
        if (Math.abs(scoreT - scoreX) < 1.5) {
            if (t5 >= 3) { scoreT += 1;
                analysisReasons.push('Xu hướng ngắn hạn: Tài'); } else if (x5 >= 3) { scoreX += 1;
                analysisReasons.push('Xu hướng ngắn hạn: Xỉu'); } else if (t10 >= 6) { scoreX += 0.5;
                analysisReasons.push('Cân bằng - Ưu tiên Xỉu'); } else { scoreT += 0.5;
                analysisReasons.push('Cân bằng - Ưu tiên Tài'); }
        }

        // Áp dụng hệ số sảnh
        if (this.sanhType === 'md5') {
            scoreT *= 0.92;
            scoreX *= 0.92;
        }

        // Auto-correct thông minh khi sai liên tiếp
        let autoFixed = false;
        if (this.consecutiveLoss >= 3 && this.lastPrediction) {
            const oldDecision = scoreT > scoreX ? 'Tài' : (scoreX > scoreT ? 'Xỉu' : (t5 >= 3 ? 'Tài' : 'Xỉu'));
            // Đảo ngược quyết định
            if (oldDecision === 'Tài') { scoreT = scoreX - 1;
                autoFixed = true; } else { scoreX = scoreT - 1;
                autoFixed = true; }
            analysisReasons.push('⚡ AUTO-CORRECT (sai 3 lần liên tiếp)');
        }

        // Quyết định cuối cùng
        let finalDecision;
        if (scoreT > scoreX) finalDecision = 'Tài';
        else if (scoreX > scoreT) finalDecision = 'Xỉu';
        else finalDecision = t5 >= 3 ? 'Tài' : 'Xỉu';

        // Tính độ tin cậy thực tế
        const totalScore = Math.abs(scoreT) + Math.abs(scoreX);
        const gap = Math.abs(scoreT - scoreX);
        let confidence = 50;

        if (totalScore > 0) {
            confidence = 50 + (gap / totalScore) * 38;
            // Điều chỉnh theo streak
            if (currentStreak >= 8) confidence = Math.min(confidence + 12, 90);
            else if (currentStreak >= 6) confidence = Math.min(confidence + 8, 85);
            // Giảm confidence nếu đang auto-fix
            if (autoFixed) confidence = Math.min(confidence, 62);
            // Giảm nếu sai liên tiếp
            if (this.consecutiveLoss >= 2) confidence = Math.min(confidence, 68);
        }

        confidence = Math.round(Math.min(Math.max(confidence, 51), 89));

        this.lastPrediction = finalDecision;
        this.confidenceHistory.push(confidence);
        if (this.confidenceHistory.length > 50) this.confidenceHistory.shift();

        return {
            prediction: finalDecision,
            confidence: confidence,
            ready: true,
            reason: analysisReasons.slice(0, 5).join(' | '),
            scoreT: scoreT.toFixed(1),
            scoreX: scoreX.toFixed(1),
            streak: currentStreak,
            maxStreak: maxStreak,
            totalSessions: totalSessions,
            autoFixed: autoFixed
        };
    }

    learn(history, prediction, actual) {
        if (!prediction || !actual) return;
        this.stats.total++;
        if (prediction.prediction === actual) {
            this.stats.correct++;
            this.stats.streak = this.stats.streak > 0 ? this.stats.streak + 1 : 1;
            this.consecutiveLoss = 0;
        } else {
            this.stats.wrong++;
            this.stats.streak = this.stats.streak < 0 ? this.stats.streak - 1 : -1;
            this.consecutiveLoss++;
        }
    }

    getWinRate() {
        return this.stats.total > 0 ? Math.round((this.stats.correct / this.stats.total) * 100) : 0;
    }

    getReliability() {
        if (this.stats.total < 10) return 'Đang học...';
        const wr = this.getWinRate();
        if (wr >= 75) return 'Rất cao';
        if (wr >= 65) return 'Cao';
        if (wr >= 55) return 'Khá';
        return 'Đang cải thiện';
    }
}

const brainHU = new SieuVipElitePredictor('hu');
const brainMD5 = new SieuVipElitePredictor('md5');

function savePredictor(brain, filePath) {
    try {
        const data = {
            stats: brain.stats,
            consecutiveLoss: brain.consecutiveLoss,
            lastPrediction: brain.lastPrediction,
            predictionCache: brain.predictionCache.slice(0, 200),
            confidenceHistory: brain.confidenceHistory.slice(0, 50)
        };
        fs.writeFileSync(filePath + '.tmp', JSON.stringify(data), 'utf8');
        fs.renameSync(filePath + '.tmp', filePath);
    } catch (e) {}
}

function loadPredictor(brain, filePath) {
    try {
        if (fs.existsSync(filePath)) {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            if (data.stats) brain.stats = data.stats;
            if (data.consecutiveLoss !== undefined) brain.consecutiveLoss = data.consecutiveLoss;
            if (data.lastPrediction) brain.lastPrediction = data.lastPrediction;
            if (data.predictionCache) brain.predictionCache = data.predictionCache;
            if (data.confidenceHistory) brain.confidenceHistory = data.confidenceHistory;
        }
    } catch (e) {}
}

const brainHU_file = path.join(DATA_DIR, 'sieuvip_hu.json');
const brainMD5_file = path.join(DATA_DIR, 'sieuvip_md5.json');
loadPredictor(brainHU, brainHU_file);
loadPredictor(brainMD5, brainMD5_file);

// ═══════════════ FETCH DATA ═══════════════
function transformData(d) {
    if (!d || !d.list) return null;
    return d.list.map(item => ({
        sessionId: item.id,
        result: item.resultTruyenThong === 'TAI' ? 'Tài' : 'Xỉu',
        totalScore: item.point,
        d1: item.dices ? item.dices[0] : 0,
        d2: item.dices ? item.dices[1] : 0,
        d3: item.dices ? item.dices[2] : 0,
        timestamp: new Date().toISOString()
    }));
}

async function fetchData(type) {
    try {
        const url = type === 'hu' ? API_URL_HU : API_URL_MD5;
        const response = await axios.get(url, {
            timeout: 8000,
            headers: { 'User-Agent': 'AnhKhoiSieuVip/13.0', 'Accept': 'application/json' }
        });
        return transformData(response.data);
    } catch (err) {
        return null;
    }
}

// ═══════════════ XỬ LÝ GAME ═══════════════
async function processGame(brain, gameType, filePath) {
    try {
        const gameData = await fetchData(gameType);
        if (!gameData || gameData.length === 0) return;

        const cur = gameData[0].sessionId;
        if (brain.lastSession === cur) return;

        // Cập nhật trạng thái dự đoán cũ
        for (const r of brain.predictionCache) {
            if (r.status && r.status !== '') continue;
            const actual = gameData.find(g => g.sessionId.toString() === r.nextSession);
            if (actual) {
                r.status = (r.prediction === actual.result) ? 'ĐÚNG' : 'SAI';
                brain.learn(gameData, { prediction: r.prediction }, actual.result);
            }
        }

        const ns = cur + 1;
        if (brain.predictionCache.some(r => r.nextSession === ns.toString())) {
            brain.lastSession = cur;
            savePredictor(brain, filePath);
            return;
        }

        const result = brain.analyzeDeep(gameData);
        const rec = {
            session: cur,
            nextSession: ns.toString(),
            dice: gameData[0].d1 + '-' + gameData[0].d2 + '-' + gameData[0].d3,
            total: gameData[0].totalScore,
            actual: gameData[0].result,
            prediction: result.prediction,
            confidence: result.confidence,
            detail: result.reason,
            status: '',
            timestamp: new Date().toISOString(),
            scoreT: result.scoreT,
            scoreX: result.scoreX,
            streak: result.streak,
            autoFixed: result.autoFixed || false
        };

        brain.predictionCache.unshift(rec);
        if (brain.predictionCache.length > 300) brain.predictionCache.length = 300;
        brain.lastSession = cur;
        savePredictor(brain, filePath);

        const autoFixTag = result.autoFixed ? ' ⚡AUTO-FIX' : '';
        console.log(
            `[${gameType.toUpperCase()}] #${ns} → ${rec.prediction} (${rec.confidence}%)${autoFixTag} | T:${result.scoreT} X:${result.scoreX} | ${result.reason}`
            );
    } catch (err) {
        console.error('Process error:', err.message);
    }
}

async function autoProcess() {
    await Promise.all([
        processGame(brainHU, 'hu', brainHU_file),
        processGame(brainMD5, 'md5', brainMD5_file)
    ]);
}

function startAuto() {
    setTimeout(autoProcess, 2000);
    setInterval(autoProcess, 6000);
    console.log('🤖 Siêu VIP Elite Auto-Processing (6s)\n');
}

// ═══════════════════════════════════════════
// CSS - GIAO DIỆN SIÊU VIP CUỐN HÚT
// ═══════════════════════════════════════════
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap');

:root {
    --bg: #050510;
    --card: rgba(12, 16, 30, 0.95);
    --blue: #5b9fff;
    --blue2: #8dc4ff;
    --cyan: #00e0ff;
    --green: #00ff88;
    --red: #ff4060;
    --gold: #ffd740;
    --purple: #a78bfa;
    --text: #e8edf8;
    --text2: #8899bb;
    --border: rgba(91, 159, 255, 0.18);
    --radius: 22px;
    --radius-sm: 16px;
    --shadow: 0 30px 80px rgba(0,0,0,0.7);
    --glow: 0 0 40px rgba(91,159,255,0.15);
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
    font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-tap-highlight-color: transparent;
    overflow-x: hidden;
}

.aurora {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background: 
        radial-gradient(ellipse at 15% 40%, rgba(91,159,255,0.1) 0%, transparent 50%),
        radial-gradient(ellipse at 85% 25%, rgba(0,224,255,0.07) 0%, transparent 45%),
        radial-gradient(ellipse at 45% 85%, rgba(167,139,250,0.06) 0%, transparent 50%),
        radial-gradient(ellipse at 60% 50%, rgba(255,64,96,0.03) 0%, transparent 55%);
    animation: auroraFlow 25s ease-in-out infinite;
}
@keyframes auroraFlow {
    0%,100% { opacity: 0.7; transform: scale(1); }
    25% { opacity: 0.9; transform: scale(1.05); }
    50% { opacity: 0.75; transform: scale(1); }
    75% { opacity: 0.95; transform: scale(1.03); }
}

.stars { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
.star {
    position: absolute; width: 2px; height: 2px;
    background: #fff; border-radius: 50%;
    animation: twinkle var(--dur) ease-in-out infinite;
    animation-delay: var(--delay);
    box-shadow: 0 0 6px rgba(255,255,255,0.5);
}
@keyframes twinkle {
    0%,100% { opacity: 0.15; transform: scale(1); }
    50% { opacity: 1; transform: scale(2); }
}

.app { position: relative; z-index: 10; width: 100%; max-width: 440px; padding: 10px; }

.card {
    background: var(--card);
    backdrop-filter: blur(60px);
    -webkit-backdrop-filter: blur(60px);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 30px 22px;
    box-shadow: var(--shadow), var(--glow);
    position: relative; overflow: hidden;
    animation: cardIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes cardIn {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
}
.card::before {
    content: ''; position: absolute; top: 0; left: 15px; right: 15px; height: 1px;
    background: linear-gradient(90deg, transparent, var(--blue), var(--cyan), transparent);
    opacity: 0.5;
}
.card::after {
    content: ''; position: absolute; bottom: 0; left: 15px; right: 15px; height: 1px;
    background: linear-gradient(90deg, transparent, var(--purple), var(--blue), transparent);
    opacity: 0.3;
}

/* Logo */
.logo { text-align: center; margin-bottom: 8px; }
.logo-crown {
    font-size: 42px; animation: crownFloat 2.5s ease-in-out infinite;
    display: inline-block; filter: drop-shadow(0 0 20px rgba(255,215,64,0.5));
}
@keyframes crownFloat {
    0%,100% { transform: translateY(0) rotate(0deg); }
    25% { transform: translateY(-8px) rotate(-3deg); }
    75% { transform: translateY(-4px) rotate(3deg); }
}
.logo-text {
    font-family: 'Space Grotesk', 'Inter', sans-serif;
    font-size: 28px; font-weight: 800; letter-spacing: 6px;
    background: linear-gradient(135deg, var(--cyan), var(--blue), var(--purple));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-top: 4px;
    text-shadow: none;
}
.logo-badge {
    display: inline-block; margin-top: 10px;
    background: linear-gradient(135deg, rgba(91,159,255,0.2), rgba(167,139,250,0.18));
    border: 1px solid rgba(91,159,255,0.3);
    color: var(--blue2); font-size: 9px; font-weight: 700;
    letter-spacing: 4px; padding: 7px 18px; border-radius: 20px;
}

.zalo-contact {
    text-align: center; margin-top: 14px; padding: 12px;
    background: linear-gradient(135deg, rgba(0,180,255,0.08), rgba(167,139,250,0.06));
    border: 1px solid rgba(91,159,255,0.2);
    border-radius: 14px; font-size: 11px; color: var(--blue2);
    letter-spacing: 1px; transition: all 0.3s;
}
.zalo-contact:hover { border-color: rgba(91,159,255,0.4); box-shadow: 0 0 20px rgba(91,159,255,0.1); }
.zalo-contact a { color: var(--cyan); text-decoration: none; font-weight: 700; }

.input-wrap { margin-top: 20px; position: relative; }
.input-wrap input {
    width: 100%; padding: 16px 24px;
    background: rgba(0,0,0,0.5); border: 1px solid var(--border);
    border-radius: var(--radius-sm); color: #fff; font-size: 15px;
    text-align: center; letter-spacing: 5px; outline: none; transition: 0.4s;
    font-family: 'Space Grotesk', monospace;
}
.input-wrap input:focus {
    border-color: var(--blue);
    box-shadow: 0 0 30px rgba(91,159,255,0.25), inset 0 0 20px rgba(91,159,255,0.05);
}
.input-wrap input::placeholder { color: var(--text2); letter-spacing: 2px; }

.btn {
    width: 100%; padding: 16px; margin-top: 16px; border: none;
    border-radius: var(--radius-sm); font-size: 15px; font-weight: 700;
    cursor: pointer; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex; align-items: center; justify-content: center; gap: 10px;
    color: #fff; letter-spacing: 1px;
    background: linear-gradient(135deg, var(--blue), #4070d0);
    box-shadow: 0 10px 30px rgba(91,159,255,0.3);
    position: relative; overflow: hidden;
}
.btn::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, transparent, rgba(255,255,255,0.1), transparent);
    transition: transform 0.5s;
}
.btn:hover { transform: translateY(-3px); box-shadow: 0 18px 45px rgba(91,159,255,0.5); }
.btn:active { transform: scale(0.96); }
.btn-outline {
    background: transparent; border: 1px solid var(--border);
    color: var(--text); box-shadow: none;
}
.btn-outline:hover { background: rgba(255,255,255,0.03); border-color: var(--blue); }

.game-cards { display: flex; flex-direction: column; gap: 14px; margin-top: 20px; }
.game-card {
    background: rgba(91,159,255,0.03); border: 1px solid var(--border);
    border-radius: var(--radius-sm); padding: 22px; cursor: pointer;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex; align-items: center; gap: 18px;
    position: relative; overflow: hidden;
}
.game-card:hover {
    background: rgba(91,159,255,0.08); border-color: var(--blue);
    transform: translateY(-4px); box-shadow: 0 20px 50px rgba(0,0,0,0.5);
}
.game-card::after {
    content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%;
    background: linear-gradient(180deg, var(--blue), var(--cyan), var(--purple));
    opacity: 0; transition: 0.4s; border-radius: 0 4px 4px 0;
}
.game-card:hover::after { opacity: 1; }
.game-icon {
    width: 58px; height: 58px;
    background: linear-gradient(135deg, rgba(91,159,255,0.15), rgba(167,139,250,0.1));
    border-radius: 18px; display: flex; align-items: center;
    justify-content: center; font-size: 28px; flex-shrink: 0;
    transition: all 0.3s;
}
.game-card:hover .game-icon { transform: scale(1.08); box-shadow: 0 0 25px rgba(91,159,255,0.2); }
.game-name { font-weight: 700; font-size: 18px; letter-spacing: 1px; }
.game-desc { font-size: 11px; color: var(--text2); margin-top: 4px; }
.game-arrow {
    margin-left: auto; color: var(--text2); font-size: 20px;
    transition: all 0.4s; font-weight: 300;
}
.game-card:hover .game-arrow { color: var(--cyan); transform: translateX(6px); }

.predict-box {
    background: rgba(0,0,0,0.4); border: 1px solid var(--border);
    border-radius: var(--radius-sm); padding: 28px; text-align: center;
    margin-top: 16px; position: relative;
}
.predict-box::before {
    content: ''; position: absolute; inset: -1px; border-radius: inherit;
    padding: 1px;
    background: linear-gradient(135deg, var(--blue), transparent, var(--cyan), transparent, var(--purple));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor; mask-composite: exclude;
    opacity: 0.5;
}
.predict-label {
    font-size: 10px; color: var(--text2); letter-spacing: 4px;
    margin-bottom: 10px; text-transform: uppercase; font-weight: 600;
}
.predict-value {
    font-size: 68px; font-weight: 900; line-height: 1;
    font-family: 'Space Grotesk', sans-serif;
    animation: predictPulse 2s ease-in-out infinite;
}
@keyframes predictPulse {
    0%,100% { transform: scale(1); }
    50% { transform: scale(1.03); }
}
.tai { color: var(--green); text-shadow: 0 0 60px rgba(0,255,136,0.6); }
.xiu { color: var(--red); text-shadow: 0 0 60px rgba(255,64,96,0.6); }
.waiting { color: var(--gold); text-shadow: 0 0 40px rgba(255,215,64,0.5); }

.conf-bar {
    height: 8px; background: rgba(255,255,255,0.04);
    border-radius: 4px; margin-top: 18px; overflow: hidden;
}
.conf-fill {
    height: 100%; border-radius: 4px;
    background: linear-gradient(90deg, var(--blue), var(--cyan), var(--purple));
    transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 0 20px rgba(91,159,255,0.5);
}
.conf-text {
    display: flex; justify-content: space-between; margin-top: 8px;
    font-size: 10px; color: var(--text2); font-weight: 500;
}
.conf-text span:last-child { color: var(--blue2); font-weight: 700; }

.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 16px; }
.stat-cell {
    background: rgba(91,159,255,0.04); border: 1px solid var(--border);
    border-radius: var(--radius-sm); padding: 18px; text-align: center;
    transition: all 0.3s;
}
.stat-cell:hover { background: rgba(91,159,255,0.08); border-color: rgba(91,159,255,0.3); transform: translateY(-2px); }
.stat-value { font-size: 22px; font-weight: 700; color: var(--blue2); font-family: 'Space Grotesk', monospace; }
.stat-label { font-size: 8px; color: var(--text2); margin-top: 5px; letter-spacing: 2px; text-transform: uppercase; }

.history-section { margin-top: 22px; }
.history-title {
    font-size: 11px; color: var(--blue2); letter-spacing: 3px;
    text-align: center; margin-bottom: 14px; font-weight: 600;
}
.history-list { max-height: 240px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
.history-list::-webkit-scrollbar { width: 3px; }
.history-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
.history-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px; background: rgba(0,0,0,0.25);
    border: 1px solid rgba(91,159,255,0.08); border-radius: 12px;
    font-size: 10px; transition: all 0.2s;
}
.history-item:hover { background: rgba(91,159,255,0.06); border-color: rgba(91,159,255,0.2); }
.h-session { color: var(--blue2); font-weight: 700; min-width: 50px; font-family: 'Space Grotesk', monospace; }
.h-result { padding: 4px 14px; border-radius: 10px; font-weight: 700; font-size: 11px; }
.h-tai { background: rgba(0,255,136,0.12); color: var(--green); }
.h-xiu { background: rgba(255,64,96,0.12); color: var(--red); }
.h-status { font-size: 9px; padding: 3px 10px; border-radius: 8px; font-weight: 600; }
.h-dung { background: rgba(0,255,136,0.1); color: var(--green); }
.h-sai { background: rgba(255,64,96,0.1); color: var(--red); }
.h-cho { background: rgba(255,215,64,0.08); color: var(--gold); }

.btn-back {
    background: transparent; border: 1px solid var(--border);
    color: var(--text2); padding: 8px 18px; border-radius: 18px;
    cursor: pointer; font-size: 10px; margin-bottom: 14px; transition: all 0.3s;
    display: inline-block; letter-spacing: 1px;
}
.btn-back:hover { border-color: var(--blue); color: var(--blue2); }

.footer {
    text-align: center; margin-top: 22px; padding-top: 16px;
    border-top: 1px solid rgba(255,255,255,0.04);
    font-size: 8px; color: var(--text2); letter-spacing: 3px;
}

.warn-badge {
    display: inline-block; background: rgba(255,215,64,0.15);
    border: 1px solid rgba(255,215,64,0.3); color: var(--gold);
    font-size: 9px; padding: 4px 12px; border-radius: 12px; margin-left: 10px;
    animation: warnBlink 1s infinite; font-weight: 600;
}
@keyframes warnBlink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

.reliability-badge {
    display: inline-block; padding: 4px 10px; border-radius: 8px;
    font-size: 9px; font-weight: 600; letter-spacing: 1px;
    margin-left: 6px;
}
.rel-high { background: rgba(0,255,136,0.1); color: var(--green); }
.rel-medium { background: rgba(255,215,64,0.1); color: var(--gold); }
.rel-low { background: rgba(255,64,96,0.1); color: var(--red); }

@media (max-width: 380px) {
    .card { padding: 20px 14px; }
    .predict-value { font-size: 52px; }
    .game-card { padding: 16px; }
    .game-icon { width: 46px; height: 46px; font-size: 22px; }
}
`;

// ═══════════════ RENDER PAGES ═══════════════
function loginPage() {
    const stars = Array.from({ length: 50 }, (_, i) =>
        `<div class="star" style="left:${Math.random()*100}%;top:${Math.random()*100}%;--dur:${2+Math.random()*5}s;--delay:${Math.random()*6}s"></div>`
    ).join('');

    return `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no"><title>ANH KHOI SIÊU VIP</title><style>${CSS}</style></head><body><div class="aurora"></div><div class="stars">${stars}</div><div class="app"><div class="card"><div class="logo"><div class="logo-crown">👑</div><div class="logo-text">ANH KHOI</div><div class="logo-badge">SIÊU VIP ELITE</div></div><p style="text-align:center;font-size:12px;color:var(--text2);margin-top:12px;line-height:1.8">🔮 Phân tích độc quyền • Dự đoán chuẩn xác<br>📊 Thuật toán đa tầng • Auto-Correct thông minh</p><div class="zalo-contact">📞 Zalo Đại Ca: <a href="https://zalo.me/${ZALO_DAICA}">${ZALO_DAICA}</a> - ${DAICA_NAME}</div><div class="input-wrap"><input type="password" id="key" placeholder="Nhập mã truy cập..." autocomplete="off"></div><button class="btn" onclick="doLogin()"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="9" rx="2"/><path d="M7 11V8a5 5 0 0110 0v3"/></svg>TRUY CẬP SIÊU VIP</button><div id="msg" style="text-align:center;margin-top:12px;font-size:11px"></div><div class="footer">ANH KHOI SIÊU VIP • PHÂN TÍCH ĐỘC QUYỀN • CHUẨN XÁC</div></div></div><script>
function doLogin(){var k=document.getElementById('key').value.trim();var m=document.getElementById('msg');if(!k){m.innerHTML='<span style="color:var(--red)">Nhập mã truy cập đi Đại Ca!</span>';return}m.innerHTML='<span style="color:var(--blue)">Đang xác thực...</span>';fetch('/_api/access',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:k})}).then(r=>r.json()).then(d=>{if(d.token)window.location.href='/_home?_token='+d.token;else m.innerHTML='<span style="color:var(--gold)">Sai mã rồi Đại Ca ơi!</span>'}).catch(function(){m.innerHTML='<span style="color:var(--red)">Lỗi kết nối!</span>'});}
document.getElementById('key').addEventListener('keydown',function(e){if(e.key==='Enter')doLogin();});
</script></body></html>`;
}

function homePage(token) {
    const stars = Array.from({ length: 35 }, (_, i) =>
        `<div class="star" style="left:${Math.random()*100}%;top:${Math.random()*100}%;--dur:${2+Math.random()*5}s;--delay:${Math.random()*6}s"></div>`
    ).join('');

    return `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no"><title>ANH KHOI SIÊU VIP | CHỌN SẢNH</title><style>${CSS}</style></head><body><div class="aurora"></div><div class="stars">${stars}</div><div class="app"><div class="card"><div class="logo"><div class="logo-crown">👑</div><div class="logo-text" style="font-size:24px">ANH KHOI</div><div class="logo-badge">SIÊU VIP ELITE</div></div><p style="text-align:center;font-size:14px;font-weight:700;color:var(--blue2);margin:14px 0;letter-spacing:3px">⚡ CHỌN SẢNH PHÂN TÍCH ⚡</p><div class="zalo-contact">📞 Zalo Đại Ca: <a href="https://zalo.me/${ZALO_DAICA}">${ZALO_DAICA}</a> - ${DAICA_NAME}</div><div class="game-cards"><div class="game-card" onclick="location.href='/_hu?_token=${token}'"><div class="game-icon">🎰</div><div><div class="game-name">TÀI XỈU HŨ</div><div class="game-desc">Phân tích vòng quay • Dự đoán nổ hũ</div></div><div class="game-arrow">→</div></div><div class="game-card" onclick="location.href='/_md5?_token=${token}'"><div class="game-icon">🔐</div><div><div class="game-name">TÀI XỈU MD5</div><div class="game-desc">Giải mã chuỗi băm • Dự đoán siêu tốc</div></div><div class="game-arrow">→</div></div></div><div style="text-align:center;margin-top:20px"><button class="btn-back" onclick="location.href='/_login'">Đăng xuất</button></div><div class="footer">ANH KHOI SIÊU VIP • PHÂN TÍCH ĐỘC QUYỀN</div></div></div></body></html>`;
}

function predictPage(brain, gameType, token) {
    const stars = Array.from({ length: 25 }, (_, i) =>
        `<div class="star" style="left:${Math.random()*100}%;top:${Math.random()*100}%;--dur:${2+Math.random()*5}s;--delay:${Math.random()*6}s"></div>`
    ).join('');

    const cache = brain.predictionCache || [];
    const recent = cache.length > 0 ? cache[0] : null;
    const pred = recent ? recent.prediction : '...';
    const conf = recent ? recent.confidence : 0;
    const cls = pred === 'Tài' ? 'tai' : pred === 'Xỉu' ? 'xiu' : 'waiting';
    const gameName = gameType === 'hu' ? 'TÀI XỈU HŨ' : 'TÀI XỈU MD5';
    const icon = gameType === 'hu' ? '🎰' : '🔐';
    const wr = brain.getWinRate();
    const reliability = brain.getReliability();
    const relClass = wr >= 75 ? 'rel-high' : wr >= 55 ? 'rel-medium' : 'rel-low';
    const warnHTML = brain.consecutiveLoss >= 3 ? '<span class="warn-badge">⚡ AUTO-CORRECT</span>' : '';
    const autoFixTag = recent && recent.autoFixed ? ' <span style="font-size:9px;color:var(--gold)">(Đã tự sửa)</span>' :
        '';

    let histHTML = '';
    for (let i = 0; i < Math.min(cache.length, 25); i++) {
        const r = cache[i];
        const st = r.status || 'CHỜ';
        const stCls = st === 'ĐÚNG' ? 'h-dung' : st === 'SAI' ? 'h-sai' : 'h-cho';
        const resCls = r.prediction === 'Tài' ? 'h-tai' : r.prediction === 'Xỉu' ? 'h-xiu' : '';
        histHTML += `<div class="history-item"><span class="h-session">#${r.nextSession||'-'}</span><span style="font-size:9px;color:var(--text2)">${gameType==='hu'?'Hũ':'MD5'}</span><span class="h-status ${stCls}">${st}</span><span style="font-size:8px;color:var(--text2)">${(r.timestamp||'').substring(11,16)||'--:--'}</span><span class="h-result ${resCls}">${r.prediction||'--'}</span></div>`;
    }

    return `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no"><title>${gameName} | ANH KHOI SIÊU VIP</title><style>${CSS}</style></head><body><div class="aurora"></div><div class="stars">${stars}</div><div class="app"><div class="card"><button class="btn-back" onclick="location.href='/_home?_token=${token}'">← Quay lại</button><div class="logo"><div style="font-size:38px">${icon}</div><div class="logo-badge">${gameName}${warnHTML}</div></div><div class="zalo-contact">📞 Zalo Đại Ca: <a href="https://zalo.me/${ZALO_DAICA}">${ZALO_DAICA}</a> - ${DAICA_NAME}</div><div class="predict-box"><div class="predict-label">🔮 DỰ ĐOÁN SIÊU VIP ${autoFixTag}</div><div class="predict-value ${cls}">${pred}</div><div class="conf-bar"><div class="conf-fill" style="width:${conf}%"></div></div><div class="conf-text"><span>Độ tin cậy phân tích</span><span>${conf}%</span></div></div><div class="stats-grid"><div class="stat-cell"><div class="stat-value" style="color:var(--green)">${brain.stats.correct}</div><div class="stat-label">Lần Phân Tích Đúng</div></div><div class="stat-cell"><div class="stat-value" style="color:var(--red)">${brain.stats.wrong}</div><div class="stat-label">Lần Phân Tích Sai</div></div><div class="stat-cell"><div class="stat-value" style="color:${wr>=65?'var(--green)':wr>=50?'var(--gold)':'var(--red)'}">${wr}%</div><div class="stat-label">Tỷ Lệ Chính Xác</div></div><div class="stat-cell"><div class="stat-value" style="color:${brain.consecutiveLoss>=3?'var(--red)':'var(--blue2)'}">${brain.consecutiveLoss}</div><div class="stat-label">Sai Liên Tiếp</div></div></div><div style="text-align:center;margin-top:10px"><span class="reliability-badge ${relClass}">Độ tin cậy: ${reliability}</span></div><div style="display:flex;gap:10px;margin-top:16px"><button class="btn" style="flex:1" onclick="location.href='/_home?_token=${token}'">🏠 Trang Chủ</button><button class="btn btn-outline" style="flex:1" onclick="location.reload()">🔄 Làm Mới</button></div><div class="history-section"><div class="history-title">📋 LỊCH SỬ PHÂN TÍCH</div><div class="history-list">${histHTML || '<div style="text-align:center;color:var(--text2);padding:20px">Chưa có lịch sử phân tích</div>'}</div></div><div class="footer">ANH KHOI SIÊU VIP • ${gameType==='hu'?'SẢNH HŨ':'SẢNH MD5'} • PHÂN TÍCH ĐỘC QUYỀN</div></div></div><script>setTimeout(function(){location.reload()},8000);</script></body></html>`;
}

// ═══════════════ MIDDLEWARE & ROUTES ═══════════════
function checkAuth(req, res, next) {
    const token = req.query['_token'] || req.headers['x-token'];
    if (!token || !TOKEN_STORE.has(token)) return res.redirect('/_login');
    next();
}

app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Server', '');
    next();
});

app.get('/_login', (req, res) => { res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(loginPage()); });
app.get('/', (req, res) => res.redirect('/_login'));

app.post('/_api/access', (req, res) => {
    const key = (req.body || {}).key;
    if (!key) return res.status(400).json({ error: 'Thiếu mã' });
    if (key === MASTER_KEY) return res.json({ token: MASTER_TOKEN });
    return res.status(401).json({ error: 'Sai mã' });
});

app.get('/_home', checkAuth, (req, res) => { res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(homePage(req.query['_token'])); });

app.get('/_hu', checkAuth, async (req, res) => {
    try {
        const data = await fetchData('hu');
        if (data) {
            for (const r of brainHU.predictionCache) {
                if (r.status && r.status !== '') continue;
                const actual = data.find(g => g.sessionId.toString() === r.nextSession);
                if (actual) { r.status = (r.prediction === actual.result) ? 'ĐÚNG' : 'SAI';
                    brainHU.learn(data, { prediction: r.prediction }, actual.result); }
            }
            const cur = data[0].sessionId;
            if (brainHU.lastSession !== cur) {
                const ns = cur + 1;
                if (!brainHU.predictionCache.some(r => r.nextSession === ns.toString())) {
                    const result = brainHU.analyzeDeep(data);
                    brainHU.predictionCache.unshift({
                        session: cur, nextSession: ns.toString(),
                        dice: data[0].d1 + '-' + data[0].d2 + '-' + data[0].d3,
                        total: data[0].totalScore, actual: data[0].result,
                        prediction: result.prediction, confidence: result.confidence,
                        detail: result.reason, status: '',
                        timestamp: new Date().toISOString(),
                        scoreT: result.scoreT, scoreX: result.scoreX,
                        streak: result.streak, autoFixed: result.autoFixed || false
                    });
                    if (brainHU.predictionCache.length > 300) brainHU.predictionCache.length = 300;
                }
                brainHU.lastSession = cur;
            }
            savePredictor(brainHU, brainHU_file);
        }
    } catch (e) {}
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(predictPage(brainHU, 'hu', req.query['_token']));
});

app.get('/_md5', checkAuth, async (req, res) => {
    try {
        const data = await fetchData('md5');
        if (data) {
            for (const r of brainMD5.predictionCache) {
                if (r.status && r.status !== '') continue;
                const actual = data.find(g => g.sessionId.toString() === r.nextSession);
                if (actual) { r.status = (r.prediction === actual.result) ? 'ĐÚNG' : 'SAI';
                    brainMD5.learn(data, { prediction: r.prediction }, actual.result); }
            }
            const cur = data[0].sessionId;
            if (brainMD5.lastSession !== cur) {
                const ns = cur + 1;
                if (!brainMD5.predictionCache.some(r => r.nextSession === ns.toString())) {
                    const result = brainMD5.analyzeDeep(data);
                    brainMD5.predictionCache.unshift({
                        session: cur, nextSession: ns.toString(),
                        dice: data[0].d1 + '-' + data[0].d2 + '-' + data[0].d3,
                        total: data[0].totalScore, actual: data[0].result,
                        prediction: result.prediction, confidence: result.confidence,
                        detail: result.reason, status: '',
                        timestamp: new Date().toISOString(),
                        scoreT: result.scoreT, scoreX: result.scoreX,
                        streak: result.streak, autoFixed: result.autoFixed || false
                    });
                    if (brainMD5.predictionCache.length > 300) brainMD5.predictionCache.length = 300;
                }
                brainMD5.lastSession = cur;
            }
            savePredictor(brainMD5, brainMD5_file);
        }
    } catch (e) {}
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(predictPage(brainMD5, 'md5', req.query['_token']));
});

// API JSON
app.get('/_api/hu', checkAuth, async (req, res) => {
    try {
        const data = await fetchData('hu');
        if (data && brainHU.lastSession !== data[0].sessionId) {
            const cur = data[0].sessionId;
            const ns = cur + 1;
            if (!brainHU.predictionCache.some(r => r.nextSession === ns.toString())) {
                const result = brainHU.analyzeDeep(data);
                brainHU.predictionCache.unshift({
                    session: cur, nextSession: ns.toString(),
                    dice: data[0].d1 + '-' + data[0].d2 + '-' + data[0].d3,
                    total: data[0].totalScore, actual: data[0].result,
                    prediction: result.prediction, confidence: result.confidence,
                    detail: result.reason, status: '',
                    timestamp: new Date().toISOString(),
                    scoreT: result.scoreT, scoreX: result.scoreX,
                    streak: result.streak, autoFixed: result.autoFixed || false
                });
                brainHU.lastSession = cur;
                savePredictor(brainHU, brainHU_file);
            }
        }
        const recent = brainHU.predictionCache[0] || null;
        return res.json({
            success: true,
            prediction: recent ? recent.prediction : '...',
            confidence: recent ? recent.confidence : 0,
            nextSession: recent ? recent.nextSession : null,
            detail: recent ? recent.detail : '',
            stats: brainHU.stats,
            winRate: brainHU.getWinRate(),
            reliability: brainHU.getReliability(),
            consecutiveLoss: brainHU.consecutiveLoss,
            autoFixed: recent ? recent.autoFixed : false,
            history: brainHU.predictionCache.slice(0, 20)
        });
    } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/_api/md5', checkAuth, async (req, res) => {
    try {
        const data = await fetchData('md5');
        if (data && brainMD5.lastSession !== data[0].sessionId) {
            const cur = data[0].sessionId;
            const ns = cur + 1;
            if (!brainMD5.predictionCache.some(r => r.nextSession === ns.toString())) {
                const result = brainMD5.analyzeDeep(data);
                brainMD5.predictionCache.unshift({
                    session: cur, nextSession: ns.toString(),
                    dice: data[0].d1 + '-' + data[0].d2 + '-' + data[0].d3,
                    total: data[0].totalScore, actual: data[0].result,
                    prediction: result.prediction, confidence: result.confidence,
                    detail: result.reason, status: '',
                    timestamp: new Date().toISOString(),
                    scoreT: result.scoreT, scoreX: result.scoreX,
                    streak: result.streak, autoFixed: result.autoFixed || false
                });
                brainMD5.lastSession = cur;
                savePredictor(brainMD5, brainMD5_file);
            }
        }
        const recent = brainMD5.predictionCache[0] || null;
        return res.json({
            success: true,
            prediction: recent ? recent.prediction : '...',
            confidence: recent ? recent.confidence : 0,
            nextSession: recent ? recent.nextSession : null,
            detail: recent ? recent.detail : '',
            stats: brainMD5.stats,
            winRate: brainMD5.getWinRate(),
            reliability: brainMD5.getReliability(),
            consecutiveLoss: brainMD5.consecutiveLoss,
            autoFixed: recent ? recent.autoFixed : false,
            history: brainMD5.predictionCache.slice(0, 20)
        });
    } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/_health', (req, res) => res.json({
    status: 'running',
    version: '13.0 Sieu VIP Elite',
    zalo: ZALO_DAICA,
    daica: DAICA_NAME,
    huWinRate: brainHU.getWinRate() + '%',
    md5WinRate: brainMD5.getWinRate() + '%'
}));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('╔══════════════════════════════════════════╗');
    console.log('║   👑 ANH KHOI SIÊU VIP ELITE v13.0 👑  ║');
    console.log('║   Zalo: ' + ZALO_DAICA + '                      ║');
    console.log('║   Phân tích độc quyền - Chuẩn xác       ║');
    console.log('╚══════════════════════════════════════════╝\n');
    startAuto();
});

process.on('SIGTERM', () => {
    savePredictor(brainHU, brainHU_file);
    savePredictor(brainMD5, brainMD5_file);
    server.close(() => process.exit(0));
});
