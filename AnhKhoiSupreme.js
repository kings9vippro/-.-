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

const MASTER_KEY = crypto.randomBytes(4).toString('hex');
const TOKEN_STORE = new Map();
const MASTER_TOKEN = crypto.randomBytes(32).toString('hex');
TOKEN_STORE.set(MASTER_TOKEN, { role: 'admin', created: Date.now(), permanent: true });

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const ZALO_DAICA = '0347674021';
const DAICA_NAME = 'ANH KHOI';

console.log('\n==========================================');
console.log('  ANH KHOI DEEP LEARNING v15.0');
console.log('  "Thuat toan sieu du doan - Tim Premium"');
console.log('==========================================');
console.log('  Ma truy cap: ' + MASTER_KEY);
console.log('  Port: ' + PORT);
console.log('  Zalo Dai Ca: ' + ZALO_DAICA);
console.log('==========================================\n');

// ==========================================
// DEEP LEARNING PREDICTOR - SIEU DU DOAN
// ==========================================
class DeepLearningPredictor {
    constructor(sanhType) {
        this.sanhType = sanhType;
        this.stats = { total: 0, correct: 0, wrong: 0, streak: 0 };
        this.predictionCache = [];
        this.lastSession = null;
        this.consecutiveLoss = 0;
        this.lastPrediction = null;
        
        // Markov bac 2
        this.transitionMatrix = {};
        // Markov bac 3
        this.transitionMatrix3 = {};
        // Pattern Memory
        this.patternMemory = [];
        // Bayesian
        this.bayesianPrior = { T: 0.5, X: 0.5 };
        this.bayesianCount = { T: 0, X: 0 };
        // Strategy Weights
        this.strategyWeights = {
            markov2: 1.0,
            markov3: 1.0,
            pattern: 1.0,
            streak: 1.0,
            balance: 1.0,
            totalScore: 1.0,
            maCross: 1.0,
            bayesian: 1.0,
            reverse: 1.0,
            adaptive: 1.0
        };
        this.strategyPerformance = {};
        for (let key of Object.keys(this.strategyWeights)) {
            this.strategyPerformance[key] = { correct: 0, total: 0 };
        }
        this.learningRate = 0.15;
        this.adaptiveRate = 0.05;
        
        // Theo doi hieu suat tung khung thoi gian
        this.timeFramePerformance = {
            last5: { correct: 0, total: 0 },
            last10: { correct: 0, total: 0 },
            last20: { correct: 0, total: 0 },
            last50: { correct: 0, total: 0 }
        };
    }

    updateMarkovMatrix(history) {
        const results = history.map(h => h.result === 'Tai' ? 'T' : 'X');
        for (let i = 0; i < results.length - 2; i++) {
            const key = results[i + 1] + results[i];
            const next = results[i];
            if (!this.transitionMatrix[key]) {
                this.transitionMatrix[key] = { T: 0, X: 0, total: 0 };
            }
            this.transitionMatrix[key][next]++;
            this.transitionMatrix[key].total++;
        }
        for (let i = 0; i < results.length - 3; i++) {
            const key = results[i + 2] + results[i + 1] + results[i];
            const next = results[i];
            if (!this.transitionMatrix3[key]) {
                this.transitionMatrix3[key] = { T: 0, X: 0, total: 0 };
            }
            this.transitionMatrix3[key][next]++;
            this.transitionMatrix3[key].total++;
        }
    }

    updatePatternMemory(history) {
        const results = history.map(h => h.result === 'Tai' ? 'T' : 'X');
        if (results.length >= 5) {
            const pattern = results.slice(0, 5).join('');
            const nextResult = results.length > 5 ? results[5] : null;
            let found = this.patternMemory.find(p => p.pattern === pattern);
            if (found) {
                found.count++;
                if (nextResult) {
                    found.nextResults[nextResult] = (found.nextResults[nextResult] || 0) + 1;
                }
                found.lastSeen = Date.now();
            } else {
                this.patternMemory.push({
                    pattern: pattern,
                    count: 1,
                    nextResults: nextResult ? { [nextResult]: 1 } : {},
                    lastSeen: Date.now()
                });
            }
            if (this.patternMemory.length > 500) {
                this.patternMemory.sort((a, b) => b.lastSeen - a.lastSeen);
                this.patternMemory = this.patternMemory.slice(0, 300);
            }
        }
    }

    updateBayesian(history) {
        const results = history.map(h => h.result === 'Tai' ? 'T' : 'X');
        for (let r of results) {
            this.bayesianCount[r]++;
        }
        const total = this.bayesianCount.T + this.bayesianCount.X;
        if (total > 0) {
            this.bayesianPrior.T = this.bayesianCount.T / total;
            this.bayesianPrior.X = this.bayesianCount.X / total;
        }
    }

    reinforceStrategy(strategyName, wasCorrect) {
        const perf = this.strategyPerformance[strategyName];
        if (!perf) return;
        perf.total++;
        if (wasCorrect) perf.correct++;
        const winRate = perf.total > 0 ? perf.correct / perf.total : 0.5;
        this.strategyWeights[strategyName] = 0.3 + (winRate * 1.6);
        this.strategyWeights[strategyName] = Math.max(0.2, Math.min(2.0, this.strategyWeights[strategyName]));
    }

    predictMarkov2(results) {
        if (results.length < 3) return null;
        const key = results[1] + results[0];
        const matrix = this.transitionMatrix[key];
        if (!matrix || matrix.total < 3) return null;
        const probT = matrix.T / matrix.total;
        const probX = matrix.X / matrix.total;
        const confidence = Math.abs(probT - probX) * 100;
        return {
            prediction: probT >= probX ? 'Tai' : 'Xiu',
            confidence: Math.min(90, 50 + confidence),
            probT, probX,
            source: 'Markov bac 2'
        };
    }

    predictMarkov3(results) {
        if (results.length < 4) return null;
        const key = results[2] + results[1] + results[0];
        const matrix = this.transitionMatrix3[key];
        if (!matrix || matrix.total < 2) return null;
        const probT = matrix.T / matrix.total;
        const probX = matrix.X / matrix.total;
        const confidence = Math.abs(probT - probX) * 110;
        return {
            prediction: probT >= probX ? 'Tai' : 'Xiu',
            confidence: Math.min(92, 50 + confidence),
            probT, probX,
            source: 'Markov bac 3'
        };
    }

    predictPattern(results) {
        if (results.length < 5) return null;
        const pattern = results.slice(0, 5).join('');
        const found = this.patternMemory.find(p => p.pattern === pattern);
        if (!found || found.count < 2) return null;
        const totalNext = (found.nextResults.T || 0) + (found.nextResults.X || 0);
        if (totalNext < 2) return null;
        const probT = (found.nextResults.T || 0) / totalNext;
        const probX = (found.nextResults.X || 0) / totalNext;
        const confidence = 50 + (Math.abs(probT - probX) * 100);
        return {
            prediction: probT >= probX ? 'Tai' : 'Xiu',
            confidence: Math.min(88, confidence),
            probT, probX,
            source: `Pattern (xuat hien ${found.count} lan)`
        };
    }

    predictStreak(results) {
        let streak = 1;
        for (let i = 1; i < results.length; i++) {
            if (results[i] === results[0]) streak++;
            else break;
        }
        if (streak >= 8) {
            return {
                prediction: results[0] === 'T' ? 'Xiu' : 'Tai',
                confidence: 78 + Math.min(streak - 8, 7),
                source: `Day ${streak} - Kha nang gay cao`
            };
        } else if (streak >= 5) {
            return {
                prediction: results[0] === 'T' ? 'Xiu' : 'Tai',
                confidence: 65 + (streak - 5) * 3,
                source: `Day ${streak} - Canh bao`
            };
        } else if (streak >= 3) {
            return {
                prediction: results[0],
                confidence: 55 + streak,
                source: `Day ${streak} - Tiep tuc`
            };
        }
        return null;
    }

    predictBalance(results, totals) {
        const t10 = results.slice(0, Math.min(10, results.length)).filter(r => r === 'T').length;
        const x10 = Math.min(10, results.length) - t10;
        const t20 = results.slice(0, Math.min(20, results.length)).filter(r => r === 'T').length;
        const x20 = Math.min(20, results.length) - t20;
        let scoreT = 0, scoreX = 0;
        if (t10 >= 7) scoreX += (t10 - 6) * 1.5;
        if (x10 >= 7) scoreT += (x10 - 6) * 1.5;
        if (t20 >= 13) scoreX += (t20 - 12) * 1.2;
        if (x20 >= 13) scoreT += (x20 - 12) * 1.2;
        if (Math.abs(scoreT - scoreX) < 0.5) return null;
        const total = scoreT + scoreX;
        const confidence = total > 0 ? 50 + (Math.abs(scoreT - scoreX) / total) * 35 : 55;
        return {
            prediction: scoreT > scoreX ? 'Tai' : 'Xiu',
            confidence: Math.min(80, confidence),
            source: `Can bang (T10:${t10}/X10:${x10})`
        };
    }

    predictTotalScore(totals) {
        const lastTotal = totals[0];
        const avg3 = totals.slice(0, Math.min(3, totals.length)).reduce((a, b) => a + b, 0) / Math.min(3, totals.length);
        const avg7 = totals.slice(0, Math.min(7, totals.length)).reduce((a, b) => a + b, 0) / Math.min(7, totals.length);
        let scoreT = 0, scoreX = 0;
        if (lastTotal >= 16) scoreX += 4;
        else if (lastTotal >= 13) scoreX += 2;
        else if (lastTotal <= 5) scoreT += 4;
        else if (lastTotal <= 8) scoreT += 2;
        const maDiff = avg3 - avg7;
        if (maDiff > 2) scoreX += 2.5;
        if (maDiff < -2) scoreT += 2.5;
        if (Math.abs(scoreT - scoreX) < 0.5) return null;
        const confidence = 55 + Math.min(Math.abs(scoreT - scoreX) * 8, 30);
        return {
            prediction: scoreT > scoreX ? 'Tai' : 'Xiu',
            confidence: Math.min(82, confidence),
            source: `Tong diem (${lastTotal})`
        };
    }

    predictBayesian(results) {
        if (results.length < 5) return null;
        const recent5 = results.slice(0, 5);
        const recentT = recent5.filter(r => r === 'T').length;
        const likelihood = recentT / 5;
        const prior = this.bayesianPrior.T;
        const adjustedProbT = (prior * 0.4 + likelihood * 0.6);
        const adjustedProbX = 1 - adjustedProbT;
        return {
            prediction: adjustedProbT >= 0.5 ? 'Tai' : 'Xiu',
            confidence: 50 + Math.abs(adjustedProbT - 0.5) * 80,
            source: 'Bayesian'
        };
    }

    predictReverse(results) {
        let alternating = 0;
        for (let i = 0; i < Math.min(results.length - 1, 5); i++) {
            if (results[i] !== results[i + 1]) alternating++;
        }
        if (alternating >= 4) {
            return {
                prediction: results[0] === 'T' ? 'Xiu' : 'Tai',
                confidence: 60 + alternating * 5,
                source: `Xen ke (${alternating}/5)`
            };
        }
        return null;
    }

    predictAdaptive(results) {
        if (results.length < 10) return null;
        const recent10 = results.slice(0, 10);
        const tCount = recent10.filter(r => r === 'T').length;
        const xCount = 10 - tCount;
        // Phan tich xu huong gan day
        const first5 = recent10.slice(5, 10);
        const last5 = recent10.slice(0, 5);
        const first5T = first5.filter(r => r === 'T').length;
        const last5T = last5.filter(r => r === 'T').length;
        const trend = last5T - first5T;
        let prediction, confidence;
        if (trend > 1) {
            prediction = 'Tai';
            confidence = 55 + trend * 8;
        } else if (trend < -1) {
            prediction = 'Xiu';
            confidence = 55 + Math.abs(trend) * 8;
        } else if (tCount > 6) {
            prediction = 'Xiu';
            confidence = 58;
        } else if (xCount > 6) {
            prediction = 'Tai';
            confidence = 58;
        } else {
            prediction = tCount >= 5 ? 'Tai' : 'Xiu';
            confidence = 52;
        }
        return {
            prediction,
            confidence: Math.min(78, confidence),
            source: `Thich ung (xu huong: ${trend > 0 ? '+' : ''}${trend})`
        };
    }

    ensemblePredict(history) {
        if (!history || history.length < 3) {
            return { prediction: '...', confidence: 0, ready: false, reason: 'Dang thu thap du lieu...' };
        }

        const results = history.map(h => h.result === 'Tai' ? 'T' : 'X');
        const totals = history.map(h => h.totalScore || 10.5);

        const strategies = [
            { name: 'markov2', result: this.predictMarkov2(results) },
            { name: 'markov3', result: this.predictMarkov3(results) },
            { name: 'pattern', result: this.predictPattern(results) },
            { name: 'streak', result: this.predictStreak(results) },
            { name: 'balance', result: this.predictBalance(results, totals) },
            { name: 'totalScore', result: this.predictTotalScore(totals) },
            { name: 'bayesian', result: this.predictBayesian(results) },
            { name: 'reverse', result: this.predictReverse(results) },
            { name: 'adaptive', result: this.predictAdaptive(results) }
        ];

        const validStrategies = strategies.filter(s => s.result !== null);
        
        if (validStrategies.length === 0) {
            return { prediction: results[0] === 'T' ? 'Tai' : 'Xiu', confidence: 51, ready: true, reason: 'Mac dinh' };
        }

        let weightedT = 0, weightedX = 0, totalWeight = 0;
        let reasons = [];

        for (let strat of validStrategies) {
            const weight = this.strategyWeights[strat.name] || 1.0;
            const conf = strat.result.confidence / 100;
            const combinedWeight = weight * conf;
            if (strat.result.prediction === 'Tai') {
                weightedT += combinedWeight;
            } else {
                weightedX += combinedWeight;
            }
            totalWeight += combinedWeight;
            reasons.push(`${strat.result.source} (w:${weight.toFixed(1)})`);
        }

        const probT = totalWeight > 0 ? weightedT / totalWeight : 0.5;
        const probX = 1 - probT;
        
        let finalPrediction = probT >= probX ? 'Tai' : 'Xiu';
        
        if (this.consecutiveLoss >= 3) {
            finalPrediction = finalPrediction === 'Tai' ? 'Xiu' : 'Tai';
            reasons.push('AUTO-CORRECT');
        }
        
        const gap = Math.abs(probT - probX);
        let confidence = 50 + gap * 45;
        if (this.consecutiveLoss >= 3) confidence = Math.min(confidence, 60);
        confidence = Math.round(Math.min(Math.max(confidence, 52), 90));

        this.lastPrediction = finalPrediction;

        return {
            prediction: finalPrediction,
            confidence: confidence,
            ready: true,
            reason: reasons.slice(0, 5).join(' | '),
            probT: Math.round(probT * 100),
            probX: Math.round(probX * 100),
            strategyCount: validStrategies.length
        };
    }

    learn(history, prediction, actual) {
        if (!prediction || !actual) return;
        this.stats.total++;
        const wasCorrect = prediction.prediction === actual;
        if (wasCorrect) {
            this.stats.correct++;
            this.stats.streak = this.stats.streak > 0 ? this.stats.streak + 1 : 1;
            this.consecutiveLoss = 0;
        } else {
            this.stats.wrong++;
            this.stats.streak = this.stats.streak < 0 ? this.stats.streak - 1 : -1;
            this.consecutiveLoss++;
        }
        this.updateMarkovMatrix(history);
        this.updatePatternMemory(history);
        this.updateBayesian(history);
        for (let key of Object.keys(this.strategyWeights)) {
            const perf = this.strategyPerformance[key];
            if (perf && perf.total > 10) {
                const wr = perf.correct / perf.total;
                this.strategyWeights[key] = 0.3 + (wr * 1.6);
            }
        }
        if (wasCorrect) {
            this.learningRate = Math.min(0.3, this.learningRate * 1.02);
        } else {
            this.learningRate = Math.max(0.05, this.learningRate * 0.98);
        }
        // Cap nhat hieu suat theo khung thoi gian
        const total = this.stats.total;
        if (total <= 5) this.timeFramePerformance.last5.total++;
        if (total <= 10) this.timeFramePerformance.last10.total++;
        if (total <= 20) this.timeFramePerformance.last20.total++;
        if (total <= 50) this.timeFramePerformance.last50.total++;
        if (wasCorrect) {
            if (total <= 5) this.timeFramePerformance.last5.correct++;
            if (total <= 10) this.timeFramePerformance.last10.correct++;
            if (total <= 20) this.timeFramePerformance.last20.correct++;
            if (total <= 50) this.timeFramePerformance.last50.correct++;
        }
    }

    getWinRate() {
        return this.stats.total > 0 ? Math.round((this.stats.correct / this.stats.total) * 100) : 0;
    }

    getRecentWinRate(frames) {
        const tf = this.timeFramePerformance[frames];
        if (!tf || tf.total === 0) return 0;
        return Math.round((tf.correct / tf.total) * 100);
    }

    getReliability() {
        if (this.stats.total < 20) return 'Dang hoc sau...';
        const wr = this.getWinRate();
        if (wr >= 80) return 'Cuc cao';
        if (wr >= 70) return 'Rat cao';
        if (wr >= 60) return 'Cao';
        if (wr >= 50) return 'Kha';
        return 'Dang cai thien';
    }
}

const brainHU = new DeepLearningPredictor('hu');
const brainMD5 = new DeepLearningPredictor('md5');

function savePredictor(brain, filePath) {
    try {
        const data = {
            stats: brain.stats,
            consecutiveLoss: brain.consecutiveLoss,
            lastPrediction: brain.lastPrediction,
            predictionCache: brain.predictionCache.slice(0, 200),
            transitionMatrix: brain.transitionMatrix,
            transitionMatrix3: brain.transitionMatrix3,
            patternMemory: brain.patternMemory.slice(0, 200),
            bayesianPrior: brain.bayesianPrior,
            bayesianCount: brain.bayesianCount,
            strategyWeights: brain.strategyWeights,
            strategyPerformance: brain.strategyPerformance,
            learningRate: brain.learningRate,
            timeFramePerformance: brain.timeFramePerformance
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
            if (data.transitionMatrix) brain.transitionMatrix = data.transitionMatrix;
            if (data.transitionMatrix3) brain.transitionMatrix3 = data.transitionMatrix3;
            if (data.patternMemory) brain.patternMemory = data.patternMemory;
            if (data.bayesianPrior) brain.bayesianPrior = data.bayesianPrior;
            if (data.bayesianCount) brain.bayesianCount = data.bayesianCount;
            if (data.strategyWeights) brain.strategyWeights = data.strategyWeights;
            if (data.strategyPerformance) brain.strategyPerformance = data.strategyPerformance;
            if (data.learningRate) brain.learningRate = data.learningRate;
            if (data.timeFramePerformance) brain.timeFramePerformance = data.timeFramePerformance;
        }
    } catch (e) {}
}

const brainHU_file = path.join(DATA_DIR, 'deep_hu.json');
const brainMD5_file = path.join(DATA_DIR, 'deep_md5.json');
loadPredictor(brainHU, brainHU_file);
loadPredictor(brainMD5, brainMD5_file);

function transformData(d) {
    if (!d || !d.list) return null;
    return d.list.map(item => ({
        sessionId: item.id,
        result: item.resultTruyenThong === 'TAI' ? 'Tai' : 'Xiu',
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
            headers: { 'User-Agent': 'AnhKhoiDeepLearn/15.0', 'Accept': 'application/json' }
        });
        return transformData(response.data);
    } catch (err) {
        return null;
    }
}

async function processGame(brain, gameType, filePath) {
    try {
        const gameData = await fetchData(gameType);
        if (!gameData || gameData.length === 0) return;
        const cur = gameData[0].sessionId;
        if (brain.lastSession === cur) return;
        for (const r of brain.predictionCache) {
            if (r.status && r.status !== '') continue;
            const actual = gameData.find(g => g.sessionId.toString() === r.nextSession);
            if (actual) {
                r.status = (r.prediction === actual.result) ? 'DUNG' : 'SAI';
                brain.learn(gameData, { prediction: r.prediction }, actual.result);
            }
        }
        const ns = cur + 1;
        if (brain.predictionCache.some(r => r.nextSession === ns.toString())) {
            brain.lastSession = cur;
            savePredictor(brain, filePath);
            return;
        }
        const result = brain.ensemblePredict(gameData);
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
            probT: result.probT || 50,
            probX: result.probX || 50,
            strategyCount: result.strategyCount || 0
        };
        brain.predictionCache.unshift(rec);
        if (brain.predictionCache.length > 300) brain.predictionCache.length = 300;
        brain.lastSession = cur;
        savePredictor(brain, filePath);
        console.log(`[${gameType.toUpperCase()}] #${ns} -> ${rec.prediction} (${rec.confidence}%) | ${result.strategyCount} chien luoc | ${result.reason}`);
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
    console.log('Deep Learning Auto-Processing (6s)\n');
}

// ==========================================
// CSS TIM PREMIUM - KHONG ICON - SIEU DEP
// ==========================================
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap');

:root {
    --bg: #0a0515;
    --bg2: #0f0a1e;
    --card: rgba(20, 12, 40, 0.96);
    --purple: #9b59ff;
    --purple2: #b980ff;
    --purple3: #c9a0ff;
    --purple4: #7c3aed;
    --pink: #e040fb;
    --deep: #4a1d96;
    --green: #00ff88;
    --red: #ff4470;
    --gold: #ffd740;
    --text: #ede8f8;
    --text2: #9a8db8;
    --text3: #6b5e8a;
    --border: rgba(155, 89, 255, 0.18);
    --border2: rgba(155, 89, 255, 0.3);
    --radius: 24px;
    --radius-sm: 16px;
    --shadow: 0 35px 90px rgba(0,0,0,0.75);
    --glow: 0 0 60px rgba(155,89,255,0.15);
    --glow2: 0 0 40px rgba(155,89,255,0.25);
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
    font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
    background: var(--bg);
    background-image: 
        radial-gradient(ellipse at 20% 20%, rgba(155,89,255,0.12) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 60%, rgba(224,64,251,0.08) 0%, transparent 45%),
        radial-gradient(ellipse at 50% 90%, rgba(124,58,237,0.1) 0%, transparent 50%),
        radial-gradient(ellipse at 60% 30%, rgba(185,128,255,0.06) 0%, transparent 55%);
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
        radial-gradient(ellipse at 15% 35%, rgba(155,89,255,0.15) 0%, transparent 50%),
        radial-gradient(ellipse at 85% 25%, rgba(224,64,251,0.1) 0%, transparent 45%),
        radial-gradient(ellipse at 45% 80%, rgba(124,58,237,0.12) 0%, transparent 50%);
    animation: auroraFlow 28s ease-in-out infinite;
}
@keyframes auroraFlow {
    0%,100% { opacity: 0.7; transform: scale(1) rotate(0deg); }
    33% { opacity: 0.9; transform: scale(1.06) rotate(1deg); }
    66% { opacity: 0.75; transform: scale(1.03) rotate(-1deg); }
}

.particles {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
}
.particle {
    position: absolute; width: 2px; height: 2px;
    background: var(--purple3); border-radius: 50%;
    animation: float var(--dur) ease-in-out infinite;
    animation-delay: var(--delay);
    box-shadow: 0 0 10px rgba(155,89,255,0.8);
    opacity: 0.7;
}
@keyframes float {
    0%,100% { transform: translateY(0) scale(1); opacity: 0.3; }
    25% { transform: translateY(-30px) scale(1.5); opacity: 0.8; }
    50% { transform: translateY(-15px) scale(1); opacity: 0.5; }
    75% { transform: translateY(-40px) scale(2); opacity: 1; }
}

.app { position: relative; z-index: 10; width: 100%; max-width: 440px; padding: 10px; }

.card {
    background: var(--card);
    backdrop-filter: blur(80px);
    -webkit-backdrop-filter: blur(80px);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 32px 22px;
    box-shadow: var(--shadow), var(--glow);
    position: relative; overflow: hidden;
    animation: cardIn 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes cardIn {
    from { opacity: 0; transform: translateY(40px); }
    to { opacity: 1; transform: translateY(0); }
}
.card::before {
    content: ''; position: absolute; top: 0; left: 12px; right: 12px; height: 1px;
    background: linear-gradient(90deg, transparent, var(--purple), var(--pink), transparent);
    opacity: 0.5;
}
.card::after {
    content: ''; position: absolute; bottom: 0; left: 12px; right: 12px; height: 1px;
    background: linear-gradient(90deg, transparent, var(--purple2), var(--purple), transparent);
    opacity: 0.3;
}

.brand { text-align: center; margin-bottom: 6px; }
.brand-symbol {
    font-size: 44px; font-weight: 900; line-height: 1;
    font-family: 'Space Grotesk', sans-serif;
    background: linear-gradient(135deg, var(--purple3), var(--pink), var(--purple));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: symbolFloat 3s ease-in-out infinite;
    display: inline-block;
    filter: drop-shadow(0 0 30px rgba(155,89,255,0.6));
}
@keyframes symbolFloat {
    0%,100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
}
.brand-name {
    font-family: 'Space Grotesk', 'Inter', sans-serif;
    font-size: 28px; font-weight: 800; letter-spacing: 7px;
    background: linear-gradient(135deg, var(--purple3), var(--pink), var(--purple2));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-top: 4px;
}
.brand-badge {
    display: inline-block; margin-top: 10px;
    background: linear-gradient(135deg, rgba(155,89,255,0.25), rgba(224,64,251,0.15));
    border: 1px solid var(--border2);
    color: var(--purple3); font-size: 9px; font-weight: 700;
    letter-spacing: 4px; padding: 7px 18px; border-radius: 20px;
}

.contact-bar {
    text-align: center; margin-top: 14px; padding: 12px;
    background: linear-gradient(135deg, rgba(155,89,255,0.1), rgba(224,64,251,0.06));
    border: 1px solid var(--border);
    border-radius: 14px; font-size: 11px; color: var(--purple2);
    letter-spacing: 1px; transition: all 0.3s;
}
.contact-bar:hover { border-color: var(--border2); box-shadow: 0 0 20px rgba(155,89,255,0.15); }
.contact-bar a { color: var(--purple3); text-decoration: none; font-weight: 700; }

.input-wrap { margin-top: 20px; position: relative; }
.input-wrap input {
    width: 100%; padding: 16px 24px;
    background: rgba(10,5,25,0.6); border: 1px solid var(--border);
    border-radius: var(--radius-sm); color: #fff; font-size: 15px;
    text-align: center; letter-spacing: 5px; outline: none; transition: 0.4s;
    font-family: 'Space Grotesk', monospace;
}
.input-wrap input:focus {
    border-color: var(--purple);
    box-shadow: 0 0 35px rgba(155,89,255,0.3), inset 0 0 25px rgba(155,89,255,0.08);
}
.input-wrap input::placeholder { color: var(--text3); letter-spacing: 2px; }

.btn {
    width: 100%; padding: 16px; margin-top: 16px; border: none;
    border-radius: var(--radius-sm); font-size: 15px; font-weight: 700;
    cursor: pointer; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex; align-items: center; justify-content: center; gap: 10px;
    color: #fff; letter-spacing: 1px;
    background: linear-gradient(135deg, var(--purple4), var(--purple));
    box-shadow: 0 12px 35px rgba(155,89,255,0.4);
    position: relative; overflow: hidden;
}
.btn::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, transparent, rgba(255,255,255,0.1), transparent);
    transition: transform 0.5s;
}
.btn:hover { transform: translateY(-3px); box-shadow: 0 20px 50px rgba(155,89,255,0.6); }
.btn:active { transform: scale(0.96); }
.btn-outline {
    background: transparent; border: 1px solid var(--border);
    color: var(--text); box-shadow: none;
}
.btn-outline:hover { background: rgba(155,89,255,0.06); border-color: var(--purple); }

.game-cards { display: flex; flex-direction: column; gap: 14px; margin-top: 20px; }
.game-card {
    background: rgba(155,89,255,0.04); border: 1px solid var(--border);
    border-radius: var(--radius-sm); padding: 22px; cursor: pointer;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex; align-items: center; gap: 18px;
    position: relative; overflow: hidden;
}
.game-card:hover {
    background: rgba(155,89,255,0.1); border-color: var(--purple);
    transform: translateY(-4px); box-shadow: 0 22px 55px rgba(0,0,0,0.55);
}
.game-card::after {
    content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%;
    background: linear-gradient(180deg, var(--purple), var(--pink), var(--purple2));
    opacity: 0; transition: 0.4s; border-radius: 0 4px 4px 0;
}
.game-card:hover::after { opacity: 1; }
.game-label {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 14px; font-weight: 700; color: var(--purple3);
    letter-spacing: 2px;
}
.game-name { font-weight: 700; font-size: 18px; letter-spacing: 1px; }
.game-desc { font-size: 11px; color: var(--text3); margin-top: 4px; }
.game-action {
    margin-left: auto; color: var(--text3); font-size: 16px;
    transition: all 0.4s; font-weight: 300;
}
.game-card:hover .game-action { color: var(--pink); transform: translateX(6px); }

.predict-box {
    background: rgba(10,5,25,0.5); border: 1px solid var(--border);
    border-radius: var(--radius-sm); padding: 28px; text-align: center;
    margin-top: 16px; position: relative;
}
.predict-box::before {
    content: ''; position: absolute; inset: -1px; border-radius: inherit;
    padding: 1px;
    background: linear-gradient(135deg, var(--purple), transparent, var(--pink), transparent, var(--purple2));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor; mask-composite: exclude;
    opacity: 0.55;
}
.predict-label {
    font-size: 10px; color: var(--text3); letter-spacing: 4px;
    margin-bottom: 10px; text-transform: uppercase; font-weight: 600;
}
.predict-value {
    font-size: 72px; font-weight: 900; line-height: 1;
    font-family: 'Space Grotesk', sans-serif;
    animation: predictPulse 2.5s ease-in-out infinite;
}
@keyframes predictPulse {
    0%,100% { transform: scale(1); }
    50% { transform: scale(1.04); }
}
.tai { color: var(--green); text-shadow: 0 0 70px rgba(0,255,136,0.7); }
.xiu { color: var(--red); text-shadow: 0 0 70px rgba(255,68,112,0.7); }
.waiting { color: var(--gold); text-shadow: 0 0 50px rgba(255,215,64,0.6); }

.conf-bar {
    height: 8px; background: rgba(255,255,255,0.04);
    border-radius: 4px; margin-top: 18px; overflow: hidden;
}
.conf-fill {
    height: 100%; border-radius: 4px;
    background: linear-gradient(90deg, var(--purple4), var(--purple), var(--pink));
    transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 0 25px rgba(155,89,255,0.6);
}
.conf-text {
    display: flex; justify-content: space-between; margin-top: 8px;
    font-size: 10px; color: var(--text3); font-weight: 500;
}
.conf-text span:last-child { color: var(--purple3); font-weight: 700; }

.learning-info {
    text-align: center; margin-top: 8px; font-size: 9px; color: var(--purple2);
    letter-spacing: 2px;
}

.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 16px; }
.stat-cell {
    background: rgba(155,89,255,0.04); border: 1px solid var(--border);
    border-radius: var(--radius-sm); padding: 18px; text-align: center;
    transition: all 0.3s;
}
.stat-cell:hover { background: rgba(155,89,255,0.08); border-color: var(--border2); transform: translateY(-2px); }
.stat-value { font-size: 22px; font-weight: 700; color: var(--purple3); font-family: 'Space Grotesk', monospace; }
.stat-label { font-size: 8px; color: var(--text3); margin-top: 5px; letter-spacing: 2px; text-transform: uppercase; }

.history-section { margin-top: 22px; }
.history-title {
    font-size: 11px; color: var(--purple3); letter-spacing: 3px;
    text-align: center; margin-bottom: 14px; font-weight: 600;
}
.history-list { max-height: 240px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
.history-list::-webkit-scrollbar { width: 3px; }
.history-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
.history-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px; background: rgba(10,5,25,0.4);
    border: 1px solid rgba(155,89,255,0.08); border-radius: 12px;
    font-size: 10px; transition: all 0.2s;
}
.history-item:hover { background: rgba(155,89,255,0.06); border-color: rgba(155,89,255,0.2); }
.h-session { color: var(--purple3); font-weight: 700; min-width: 50px; font-family: 'Space Grotesk', monospace; }
.h-result { padding: 4px 14px; border-radius: 10px; font-weight: 700; font-size: 11px; }
.h-tai { background: rgba(0,255,136,0.12); color: var(--green); }
.h-xiu { background: rgba(255,68,112,0.12); color: var(--red); }
.h-status { font-size: 9px; padding: 3px 10px; border-radius: 8px; font-weight: 600; }
.h-dung { background: rgba(0,255,136,0.1); color: var(--green); }
.h-sai { background: rgba(255,68,112,0.1); color: var(--red); }
.h-cho { background: rgba(255,215,64,0.08); color: var(--gold); }

.btn-back {
    background: transparent; border: 1px solid var(--border);
    color: var(--text3); padding: 8px 18px; border-radius: 18px;
    cursor: pointer; font-size: 10px; margin-bottom: 14px; transition: all 0.3s;
    display: inline-block; letter-spacing: 1px;
}
.btn-back:hover { border-color: var(--purple); color: var(--purple3); }

.footer {
    text-align: center; margin-top: 22px; padding-top: 16px;
    border-top: 1px solid rgba(155,89,255,0.08);
    font-size: 8px; color: var(--text3); letter-spacing: 3px;
}

.warn-badge {
    display: inline-block; background: rgba(255,215,64,0.15);
    border: 1px solid rgba(255,215,64,0.3); color: var(--gold);
    font-size: 9px; padding: 4px 12px; border-radius: 12px; margin-left: 10px;
    animation: warnBlink 1s infinite; font-weight: 600;
}
@keyframes warnBlink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

@media (max-width: 380px) {
    .card { padding: 20px 14px; }
    .predict-value { font-size: 54px; }
    .game-card { padding: 16px; }
    .brand-symbol { font-size: 34px; }
    .brand-name { font-size: 22px; }
}
`;

// ==========================================
// RENDER PAGES
// ==========================================
function loginPage() {
    const particles = Array.from({ length: 50 }, (_, i) =>
        `<div class="particle" style="left:${Math.random()*100}%;top:${Math.random()*100}%;--dur:${3+Math.random()*7}s;--delay:${Math.random()*8}s"></div>`
    ).join('');

    return `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no"><title>ANH KHOI DEEP LEARNING</title><style>${CSS}</style></head><body><div class="aurora"></div><div class="particles">${particles}</div><div class="app"><div class="card"><div class="brand"><div class="brand-symbol">AK</div><div class="brand-name">ANH KHOI</div><div class="brand-badge">DEEP LEARNING</div></div><p style="text-align:center;font-size:12px;color:var(--text3);margin-top:12px;line-height:1.8">Hoc sau thich ung - Cang chay cang chinh xac<br>Markov - Bayesian - Reinforcement Learning</p><div class="contact-bar">Zalo Dai Ca: <a href="https://zalo.me/${ZALO_DAICA}">${ZALO_DAICA}</a> - ${DAICA_NAME}</div><div class="input-wrap"><input type="password" id="key" placeholder="Nhap ma truy cap..." autocomplete="off"></div><button class="btn" onclick="doLogin()">TRUY CAP HE THONG</button><div id="msg" style="text-align:center;margin-top:12px;font-size:11px"></div><div class="footer">ANH KHOI DEEP LEARNING - HOC SAU - CHINH XAC</div></div></div><script>
function doLogin(){var k=document.getElementById('key').value.trim();var m=document.getElementById('msg');if(!k){m.innerHTML='<span style="color:var(--red)">Nhap ma truy cap!</span>';return}m.innerHTML='<span style="color:var(--purple3)">Dang xac thuc...</span>';fetch('/_api/access',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:k})}).then(r=>r.json()).then(d=>{if(d.token)window.location.href='/_home?_token='+d.token;else m.innerHTML='<span style="color:var(--gold)">Sai ma truy cap!</span>'}).catch(function(){m.innerHTML='<span style="color:var(--red)">Loi ket noi!</span>'});}
document.getElementById('key').addEventListener('keydown',function(e){if(e.key==='Enter')doLogin();});
</script></body></html>`;
}

function homePage(token) {
    const particles = Array.from({ length: 40 }, (_, i) =>
        `<div class="particle" style="left:${Math.random()*100}%;top:${Math.random()*100}%;--dur:${3+Math.random()*7}s;--delay:${Math.random()*8}s"></div>`
    ).join('');

    return `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no"><title>ANH KHOI DEEP LEARNING | CHON SANH</title><style>${CSS}</style></head><body><div class="aurora"></div><div class="particles">${particles}</div><div class="app"><div class="card"><div class="brand"><div class="brand-symbol">AK</div><div class="brand-name" style="font-size:24px">ANH KHOI</div><div class="brand-badge">DEEP LEARNING</div></div><p style="text-align:center;font-size:14px;font-weight:700;color:var(--purple3);margin:14px 0;letter-spacing:3px">CHON SANH PHAN TICH</p><div class="contact-bar">Zalo Dai Ca: <a href="https://zalo.me/${ZALO_DAICA}">${ZALO_DAICA}</a> - ${DAICA_NAME}</div><div class="game-cards"><div class="game-card" onclick="location.href='/_hu?_token=${token}'"><div class="game-label">HU</div><div><div class="game-name">TAI XIU HU</div><div class="game-desc">Deep Learning - Du doan no hu</div></div><div class="game-action">--></div></div><div class="game-card" onclick="location.href='/_md5?_token=${token}'"><div class="game-label">MD5</div><div><div class="game-name">TAI XIU MD5</div><div class="game-desc">Deep Learning - Du doan sieu toc</div></div><div class="game-action">--></div></div></div><div style="text-align:center;margin-top:20px"><button class="btn-back" onclick="location.href='/_login'">Dang xuat</button></div><div class="footer">ANH KHOI DEEP LEARNING - HOC SAU THICH UNG</div></div></div></body></html>`;
}

function predictPage(brain, gameType, token) {
    const particles = Array.from({ length: 30 }, (_, i) =>
        `<div class="particle" style="left:${Math.random()*100}%;top:${Math.random()*100}%;--dur:${3+Math.random()*7}s;--delay:${Math.random()*8}s"></div>`
    ).join('');

    const cache = brain.predictionCache || [];
    const recent = cache.length > 0 ? cache[0] : null;
    const pred = recent ? recent.prediction : '...';
    const conf = recent ? recent.confidence : 0;
    const cls = pred === 'Tai' ? 'tai' : pred === 'Xiu' ? 'xiu' : 'waiting';
    const gameName = gameType === 'hu' ? 'TAI XIU HU' : 'TAI XIU MD5';
    const gameLabel = gameType === 'hu' ? 'HU' : 'MD5';
    const wr = brain.getWinRate();
    const reliability = brain.getReliability();
    const warnHTML = brain.consecutiveLoss >= 3 ? '<span class="warn-badge">AUTO-CORRECT</span>' : '';
    const strategyCount = recent ? recent.strategyCount || 0 : 0;
    const learningRate = brain.learningRate.toFixed(3);

    let histHTML = '';
    for (let i = 0; i < Math.min(cache.length, 25); i++) {
        const r = cache[i];
        const st = r.status || 'CHO';
        const stCls = st === 'DUNG' ? 'h-dung' : st === 'SAI' ? 'h-sai' : 'h-cho';
        const resCls = r.prediction === 'Tai' ? 'h-tai' : r.prediction === 'Xiu' ? 'h-xiu' : '';
        histHTML += `<div class="history-item"><span class="h-session">#${r.nextSession||'-'}</span><span style="font-size:9px;color:var(--text3)">${gameLabel}</span><span class="h-status ${stCls}">${st}</span><span style="font-size:8px;color:var(--text3)">${(r.timestamp||'').substring(11,16)||'--:--'}</span><span class="h-result ${resCls}">${r.prediction||'--'}</span></div>`;
    }

    return `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no"><title>${gameName} | ANH KHOI DEEP LEARNING</title><style>${CSS}</style></head><body><div class="aurora"></div><div class="particles">${particles}</div><div class="app"><div class="card"><button class="btn-back" onclick="location.href='/_home?_token=${token}'">Quay lai</button><div class="brand"><div class="brand-symbol" style="font-size:34px">${gameLabel}</div><div class="brand-badge">${gameName}${warnHTML}</div></div><div class="contact-bar">Zalo Dai Ca: <a href="https://zalo.me/${ZALO_DAICA}">${ZALO_DAICA}</a> - ${DAICA_NAME}</div><div class="predict-box"><div class="predict-label">DU DOAN HOC SAU (${strategyCount} chien luoc)</div><div class="predict-value ${cls}">${pred}</div><div class="conf-bar"><div class="conf-fill" style="width:${conf}%"></div></div><div class="conf-text"><span>Do tin cay</span><span>${conf}%</span></div></div><div class="learning-info">Learning Rate: ${learningRate} | Do tin cay: ${reliability}</div><div class="stats-grid"><div class="stat-cell"><div class="stat-value" style="color:var(--green)">${brain.stats.correct}</div><div class="stat-label">Du Doan Dung</div></div><div class="stat-cell"><div class="stat-value" style="color:var(--red)">${brain.stats.wrong}</div><div class="stat-label">Du Doan Sai</div></div><div class="stat-cell"><div class="stat-value" style="color:${wr>=70?'var(--green)':wr>=55?'var(--gold)':'var(--red)'}">${wr}%</div><div class="stat-label">Ty Le Chinh Xac</div></div><div class="stat-cell"><div class="stat-value">${strategyCount}</div><div class="stat-label">Chien Luoc</div></div></div><div style="display:flex;gap:10px;margin-top:16px"><button class="btn" style="flex:1" onclick="location.href='/_home?_token=${token}'">Trang Chu</button><button class="btn btn-outline" style="flex:1" onclick="location.reload()">Lam Moi</button></div><div class="history-section"><div class="history-title">LICH SU HOC SAU</div><div class="history-list">${histHTML || '<div style="text-align:center;color:var(--text3);padding:20px">Dang hoc...</div>'}</div></div><div class="footer">ANH KHOI DEEP LEARNING v15 - ${gameLabel} SANH</div></div></div><script>setTimeout(function(){location.reload()},8000);</script></body></html>`;
}

// ==========================================
// MIDDLEWARE & ROUTES
// ==========================================
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

app.get('/_login', (req, res) => { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.send(loginPage()); });
app.get('/', (req, res) => res.redirect('/_login'));

app.post('/_api/access', (req, res) => {
    const key = (req.body || {}).key;
    if (!key) return res.status(400).json({ error: 'Thieu ma' });
    if (key === MASTER_KEY) return res.json({ token: MASTER_TOKEN });
    return res.status(401).json({ error: 'Sai ma' });
});

app.get('/_home', checkAuth, (req, res) => { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.send(homePage(req.query['_token'])); });

app.get('/_hu', checkAuth, async (req, res) => {
    try {
        const data = await fetchData('hu');
        if (data) {
            for (const r of brainHU.predictionCache) {
                if (r.status && r.status !== '') continue;
                const actual = data.find(g => g.sessionId.toString() === r.nextSession);
                if (actual) { r.status = (r.prediction === actual.result) ? 'DUNG' : 'SAI'; brainHU.learn(data, { prediction: r.prediction }, actual.result); }
            }
            const cur = data[0].sessionId;
            if (brainHU.lastSession !== cur) {
                const ns = cur + 1;
                if (!brainHU.predictionCache.some(r => r.nextSession === ns.toString())) {
                    const result = brainHU.ensemblePredict(data);
                    brainHU.predictionCache.unshift({
                        session: cur, nextSession: ns.toString(),
                        dice: data[0].d1 + '-' + data[0].d2 + '-' + data[0].d3,
                        total: data[0].totalScore, actual: data[0].result,
                        prediction: result.prediction, confidence: result.confidence,
                        detail: result.reason, status: '',
                        timestamp: new Date().toISOString(),
                        probT: result.probT || 50, probX: result.probX || 50,
                        strategyCount: result.strategyCount || 0
                    });
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
                if (actual) { r.status = (r.prediction === actual.result) ? 'DUNG' : 'SAI'; brainMD5.learn(data, { prediction: r.prediction }, actual.result); }
            }
            const cur = data[0].sessionId;
            if (brainMD5.lastSession !== cur) {
                const ns = cur + 1;
                if (!brainMD5.predictionCache.some(r => r.nextSession === ns.toString())) {
                    const result = brainMD5.ensemblePredict(data);
                    brainMD5.predictionCache.unshift({
                        session: cur, nextSession: ns.toString(),
                        dice: data[0].d1 + '-' + data[0].d2 + '-' + data[0].d3,
                        total: data[0].totalScore, actual: data[0].result,
                        prediction: result.prediction, confidence: result.confidence,
                        detail: result.reason, status: '',
                        timestamp: new Date().toISOString(),
                        probT: result.probT || 50, probX: result.probX || 50,
                        strategyCount: result.strategyCount || 0
                    });
                }
                brainMD5.lastSession = cur;
            }
            savePredictor(brainMD5, brainMD5_file);
        }
    } catch (e) {}
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(predictPage(brainMD5, 'md5', req.query['_token']));
});

app.get('/_api/hu', checkAuth, async (req, res) => {
    try {
        const data = await fetchData('hu');
        if (data && brainHU.lastSession !== data[0].sessionId) {
            const cur = data[0].sessionId;
            const ns = cur + 1;
            if (!brainHU.predictionCache.some(r => r.nextSession === ns.toString())) {
                const result = brainHU.ensemblePredict(data);
                brainHU.predictionCache.unshift({
                    session: cur, nextSession: ns.toString(),
                    dice: data[0].d1 + '-' + data[0].d2 + '-' + data[0].d3,
                    total: data[0].totalScore, actual: data[0].result,
                    prediction: result.prediction, confidence: result.confidence,
                    detail: result.reason, status: '',
                    timestamp: new Date().toISOString(),
                    probT: result.probT || 50, probX: result.probX || 50,
                    strategyCount: result.strategyCount || 0
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
            learningRate: brainHU.learningRate,
            strategyWeights: brainHU.strategyWeights,
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
                const result = brainMD5.ensemblePredict(data);
                brainMD5.predictionCache.unshift({
                    session: cur, nextSession: ns.toString(),
                    dice: data[0].d1 + '-' + data[0].d2 + '-' + data[0].d3,
                    total: data[0].totalScore, actual: data[0].result,
                    prediction: result.prediction, confidence: result.confidence,
                    detail: result.reason, status: '',
                    timestamp: new Date().toISOString(),
                    probT: result.probT || 50, probX: result.probX || 50,
                    strategyCount: result.strategyCount || 0
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
            learningRate: brainMD5.learningRate,
            strategyWeights: brainMD5.strategyWeights,
            history: brainMD5.predictionCache.slice(0, 20)
        });
    } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/_health', (req, res) => res.json({
    status: 'running',
    version: '15.0 Deep Learning',
    zalo: ZALO_DAICA,
    huWinRate: brainHU.getWinRate() + '%',
    md5WinRate: brainMD5.getWinRate() + '%'
}));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('==========================================');
    console.log('  ANH KHOI DEEP LEARNING v15 ONLINE');
    console.log('  Zalo: ' + ZALO_DAICA);
    console.log('  Tim Premium - Hoc Sau - Chinh Xac');
    console.log('==========================================\n');
    startAuto();
});

process.on('SIGTERM', () => {
    savePredictor(brainHU, brainHU_file);
    savePredictor(brainMD5, brainMD5_file);
    server.close(() => process.exit(0));
});
