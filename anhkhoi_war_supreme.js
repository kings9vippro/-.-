const { Telegraf, Markup } = require("telegraf");
const http = require("http");
const fs = require("fs");
const path = require("path");

// ==================== HẠT NHÂN THÔNG SỐ (HARDCODED) ====================
// Token được đóng đinh trực tiếp, không phụ thuộc vào cấu hình Render
const BOT_TOKEN = "8251965879:AAFHl0iLezOJrjQLxWQHeMc1RoK8ul7-K7g"; 
const PORT = parseInt(process.env.PORT || "8080", 10);
const SUPER_ADMINS = [6094686933]; 

const BOT_NAME = "亗 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 𝕯𝕺̣̂𝕮 𝕹𝕳𝕬̂́𝕿 𝖁𝕺̂ 𝕹𝖁𝕴 亗";
const FREE_BOT = "@treo_khoi_bot";
const PROTECTED = ["anhkhoi", "anh_khoi", "pham_anh_khoi", "dev_anh_khoi", "6094686933"];

const DB_FILE = path.join(__dirname, "anhkhoi_db.json");
const CORPUS_FILE = path.join(__dirname, "anhkhoi_corpus.json");

// ==================== CƠ CHẾ TỰ SÁT ĐỂ RENDER REBOOT (WATCHDOG) ====================
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Lỗi không thể phục hồi (Unhandled Rejection):', reason);
  process.exit(1);
});
process.on('uncaughtException', (error) => {
  console.error('[FATAL] Tiến trình sụp đổ (Uncaught Exception):', error);
  process.exit(1);
});

// ==================== WEB SERVER GIẢ LẬP (ĐÁNH LỪA RENDER) ====================
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(`[KHAOS-TITAN] HỆ THỐNG ANH KHÔI ĐANG VẬN HÀNH 24/7\nPORT BINDING: ${PORT}`);
});
server.listen(PORT, "0.0.0.0", () => {
  console.log(`[*] Web Server Render đã chiếm quyền Port: ${PORT}`);
});

// ==================== BỘ NHỚ CỤC BỘ & DEDUPLICATION ====================
const DEFAULT_CORPUS = [
  "Quỳ xuống trước mặt Anh Khôi Độc Nhất Vô Nhị đi con phế vật",
  "Đẳng cấp của Anh Khôi là thứ cả đời mày không bao giờ chạm tới được",
  "Một đòn thanh tẩy của Anh Khôi đủ xóa sổ cả gia phả nhà mày",
  "Hỏa lực tối đa kích hoạt, quét sạch mọi đối thủ"
];

function initDb() {
  return { server_key: true, users: {}, keys: {}, tasks: {}, banned: [], auth: [], admins: [], delay: 0.0001 };
}

function loadDb() {
  if (fs.existsSync(DB_FILE)) {
    try { return Object.assign(initDb(), JSON.parse(fs.readFileSync(DB_FILE, "utf8"))); } catch (e) {}
  }
  return initDb();
}
const db = loadDb();

function saveDb() {
  try { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8"); } catch (e) {}
}

function loadCorpus() {
  const uniqueSet = new Set(DEFAULT_CORPUS.map((s) => s.trim()));
  if (fs.existsSync(CORPUS_FILE)) {
    try {
      const raw = JSON.parse(fs.readFileSync(CORPUS_FILE, "utf8"));
      if (Array.isArray(raw)) raw.forEach(i => { if (typeof i === "string" && i.trim().length >= 3) uniqueSet.add(i.trim()); });
    } catch (e) {}
  } else {
    fs.writeFileSync(CORPUS_FILE, JSON.stringify([...uniqueSet], null, 2), "utf8");
  }
  return [...uniqueSet];
}
let memoryCorpus = loadCorpus();

// ==================== BỘ LỌC QUYỀN TRUY CẬP TỐI CAO ====================
function isAdm(uid) { return SUPER_ADMINS.includes(Number(uid)) || (db.admins && db.admins.includes(Number(uid))); }

function checkAuth(ctx) {
  const uid = ctx.from ? ctx.from.id : 0;
  if (db.banned.includes(uid)) return "banned";
  if (isAdm(uid)) return "ok";
  if (db.auth.includes(uid)) return "ok";
  if (db.server_key) {
    const exp = db.users[uid];
    if (!exp || new Date(exp).getTime() < Date.now()) return "key";
  }
  return "ok";
}

async function replyDeny(ctx, reason) {
  if (reason === "key") return ctx.reply(`🔑 Cần Mã Kích Hoạt Của Anh Khôi! Cú pháp: \`/nhapma <MÃ>\`\n👑 Bot: ${FREE_BOT}`);
  if (reason === "banned") return ctx.reply("🚫 Ngươi đã bị Anh Khôi phong sát toàn diện!");
}

// ==================== HỆ THỐNG KẾT NỐI TELEGRAM (TELEGRAF) ====================
const bot = new Telegraf(BOT_TOKEN);

// CẢM BIẾN TẦNG THẤP: In ra mọi tin nhắn bot nhận được để giám sát trên Render Logs
bot.use(async (ctx, next) => {
  console.log(`[+] ĐÃ NHẬN TÍN HIỆU | Lệnh/Text: ${ctx.message?.text \vert{}\vert{} 'Non-text'} \vert{} UID: ${ctx.from?.id}`);
  return next();
});

bot.catch((err, ctx) => {
  console.error(`[!] LỖI KHI XỬ LÝ UPDATE CHO UID ${ctx.from?.id}:`, err);
});

// LỆNH VƯỢT TƯỜNG LỬA (BYPASS AUTH) ĐỂ TEST BOT SỐNG/CHẾT
bot.command(["start", "help", "lenh"], async (ctx) => {
  let text = `⚡ **${BOT_NAME}** ⚡\n👑 Tác giả độc quyền: **Anh Khôi**\nUID của bạn: \`${ctx.from.id}\`\n\n**HỎA LỰC TẤN CÔNG:**\n\`/tancoc @user\` | \`/cuongbao @user\`\n\`/tamxa @user\` | \`/satngon @user\`\n\`/phatngon <text>\` | \`/dinhchi\` | \`/tocdo\``;
  if (isAdm(ctx.from.id)) text += `\n\n**👑 LỆNH THỐNG SOÁI:** \`/capma\` | \`/kho\``;
  ctx.reply(text);
});

bot.command("myid", (ctx) => {
  ctx.reply(`🆔 ID Telegram của bạn là: \`${ctx.from.id}\`\nTrạng thái Admin: ${isAdm(ctx.from.id) ? "✅ Có" : "❌ Không"}`);
});

// ==================== ENGINE TẤN CÔNG ĐA LUỒNG ====================
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const SUOC_MODERN = ["亗 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 𝕯𝕺̣̂𝕮 𝕹𝕳𝕬̂́𝕿 𝖁𝕺̂ 𝕹𝖁𝕴 亗", "𒆜 ☬ 𝕯𝕰𝕬𝕿𝕳 𝕽𝕰𝕬𝕷𝕸 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 ☬ 𒆜"];
const ICONS_MODERN = ["亗", "𖤍", "🜲", "⚡"];

function getRandomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function lol() { return "=" + ")".repeat(Math.floor(Math.random() * 8) + 3); }

async function turboWorker(chatId, target, mention, mode, content, tid, stats) {
  while (db.tasks[tid]) {
    try {
      const delay = Math.max(parseFloat(db.delay || 0.0001), 0.00001);
      const banner = `${getRandomItem(SUOC_MODERN)}\n\n${mention ? mention + "\n" : ""}⚡ 亗 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 𝕯𝕺̣̂𝕮 𝕹𝕳𝕬̂́𝕿 𝖁𝕺̂ 𝕹𝖁𝕴 亗 ⚡`;
      
      if (mode === "tancoc") await bot.telegram.sendMessage(chatId, banner);
      else if (mode === "tamxa") await bot.telegram.sendMessage(target, banner);
      else if (mode === "phatngon") await bot.telegram.sendMessage(chatId, `${mention}\n${content}`);
      else if (mode === "satngon") {
        const base = memoryCorpus.length > 0 ? getRandomItem(memoryCorpus) : "Anh Khôi Vô Địch";
        await bot.telegram.sendMessage(chatId, `𖤍 ${mention ? mention + " " : ""}${base}${lol()}`);
      }

      stats.count++;
      stats.err = 0;
      await sleep(delay > 0.001 ? delay * 1000 : 1);
    } catch (err) {
      if (err.response?.error_code === 429) {
        await sleep((err.response.parameters?.retry_after || 3) * 1000);
      } else {
        stats.err++;
        if (stats.err >= 5) { db.tasks[tid] = false; break; }
        await sleep(1000);
      }
    }
  }
}

async function supremeEngine(chatId, userId, target, mention, mode, content, workersCount) {
  const tid = `${chatId}_${userId}`;
  db.tasks[tid] = true;
  saveDb();
  const stats = { count: 0, err: 0 };

  try { await bot.telegram.sendMessage(chatId, `🚀 **XUNG TRẬN!**\n🎯 Mục tiêu: ${mention || target}\n⚡ Chế độ: ${mode.toUpperCase()} \vert{} Luồng: x${workersCount}`); } catch (e) {}
  
  for (let i = 0; i < workersCount; i++) turboWorker(chatId, target, mention, mode, content, tid, stats);

  while (db.tasks[tid]) {
    await sleep(300 * 1000);
    if (!db.tasks[tid]) break;
    try { await bot.telegram.sendMessage(chatId, `💤 Đang đảo luồng, đã xả: **${stats.count}** đòn`); } catch (e) {}
    await sleep(25 * 1000);
  }
  db.tasks[tid] = false;
  saveDb();
}

function resolveTarget(ctx) {
  let target = null, mention = null;
  const msg = ctx.message;
  if (msg.reply_to_message?.from) {
    target = msg.reply_to_message.from.id;
    mention = msg.reply_to_message.from.username ? `@${msg.reply_to_message.from.username}` : `[User](tg://user?id=${target})`;
  } else {
    const parts = (msg.text || "").trim().split(/\s+/);
    if (parts.length > 1) {
      target = parts[1];
      mention = parts[1];
      if (!parts[1].startsWith("@") && !isNaN(parseInt(parts[1], 10))) {
        target = parseInt(parts[1], 10);
        mention = `\`${target}\``;
      }
    }
  }
  return { target, mention };
}

bot.command("tancoc", async (ctx) => {
  if (checkAuth(ctx) !== "ok") return replyDeny(ctx, checkAuth(ctx));
  const { target, mention } = resolveTarget(ctx);
  if (!target) return ctx.reply("❌ Cú pháp: `/tancoc @user`");
  supremeEngine(ctx.chat.id, ctx.from.id, target, mention, "tancoc", null, 1);
});

bot.command("cuongbao", async (ctx) => {
  if (checkAuth(ctx) !== "ok") return replyDeny(ctx, checkAuth(ctx));
  const { target, mention } = resolveTarget(ctx);
  if (!target) return ctx.reply("❌ Cú pháp: `/cuongbao @user`");
  supremeEngine(ctx.chat.id, ctx.from.id, target, mention, "tancoc", null, 3);
});

bot.command("satngon", async (ctx) => {
  if (checkAuth(ctx) !== "ok") return replyDeny(ctx, checkAuth(ctx));
  const { target, mention } = resolveTarget(ctx);
  supremeEngine(ctx.chat.id, ctx.from.id, target || ctx.chat.id, mention || "", "satngon", null, 2);
});

bot.command("dinhchi", (ctx) => {
  const tid = `${ctx.chat.id}_${ctx.from.id}`;
  if (isAdm(ctx.from.id)) {
    let stopped = 0;
    Object.keys(db.tasks).forEach(k => { if (k.startsWith(`${ctx.chat.id}_`) && db.tasks[k]) { db.tasks[k] = false; stopped++; } });
    saveDb();
    return ctx.reply(`🛑 Đã đình chỉ toàn bộ **${stopped}** chiến dịch!`);
  }
  if (db.tasks[tid]) { db.tasks[tid] = false; saveDb(); ctx.reply("🛑 Đã dừng chiến dịch cá nhân!"); } 
  else ctx.reply("⚠️ Không có chiến dịch nào đang chạy.");
});

bot.command("tocdo", (ctx) => {
  if (checkAuth(ctx) !== "ok") return replyDeny(ctx, checkAuth(ctx));
  const p = ctx.message.text.trim().split(/\s+/);
  if (p.length === 1) return ctx.reply(`⚡ **TỐC ĐỘ:** \`${db.delay || 0.0001}s\``, Markup.inlineKeyboard([[Markup.button.callback("⚡ Turbo (0.0001s)", "spd_0.0001"), Markup.button.callback("🐢 Chậm (1s)", "spd_1.0")]]));
  db.delay = Math.max(parseFloat(p[1]) || 0.0001, 0.00001);
  saveDb();
  ctx.reply(`✅ Cập nhật tốc độ: **${db.delay}s/đòn**`);
});

bot.action(/^spd_([\d\.]+)$/, async (ctx) => {
  db.delay = parseFloat(ctx.match[1]);
  saveDb();
  await ctx.answerCbQuery(`Tốc độ: ${db.delay}s`);
  ctx.editMessageText(`✅ Đã thiết lập tốc độ: **${db.delay}s/đòn**`);
});

// ==================== KHỞI ĐỘNG VÀ XÓA WEBHOOK RÁC ====================
async function bootstrap() {
  try {
    // Ép buộc dọn dẹp các update bị kẹt hoặc cấu hình Webhook cũ gây xung đột
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    
    const me = await bot.telegram.getMe();
    console.log(`\n[+] API HANDSHAKE THÀNH CÔNG! Định danh: @${me.username} (ID: ${me.id})`);
    
    bot.launch().then(() => console.log("[*] TELEGRAM LONG-POLLING ĐÃ KÍCH HOẠT!"));
  } catch (err) {
    console.error(`\n[FATAL] KHÔNG THỂ KẾT NỐI TELEGRAM API. Chi tiết: ${err.message}`);
    process.exit(1); 
  }

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

bootstrap();
