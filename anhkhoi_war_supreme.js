const { Telegraf, Markup } = require("telegraf");
const http = require("http");
const fs = require("fs");
const path = require("path");

// ==================== CẤU HÌNH THÔNG SỐ HỆ THỐNG ====================
const BOT_TOKEN = process.env.BOT_TOKEN || "8251965879:AAFHl0iLezOJrjQLxWQHeMc1RoK8ul7-K7g";
const PORT = parseInt(process.env.PORT || "8080", 10);
const SUPER_ADMINS = [6094686933];
const BOT_NAME = "亗 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 𝕯𝕺̣̂𝕮 𝕹𝕳𝕬̂́𝕿 𝖁𝕺̂ 𝕹𝖁𝕴 亗";
const FREE_BOT = "@treo_khoi_Bot";
const PROTECTED = ["anhkhoi", "anh_khoi", "pham_anh_khoi", "dev_anh_khoi", "6094686933"];

const DB_FILE = path.join(__dirname, "anhkhoi_db.json");
const CORPUS_FILE = path.join(__dirname, "anhkhoi_corpus.json");

// ==================== BỘ GIÁP CHỐNG CRASH NGẦM (GLOBAL EXCEPTION SHIELD) ====================
process.on('unhandledRejection', (reason, promise) => {
  console.error('[!] KERNEL PANIC (Unhandled Rejection):', reason);
});
process.on('uncaughtException', (error) => {
  console.error('[!] KERNEL PANIC (Uncaught Exception):', error);
});

// ==================== KHỞI TẠO WEB SERVER (RENDER KEEP-ALIVE) ====================
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(`${BOT_NAME}\nTRẠNG THÁI: KHAOS TITAN ENGINE RUNNING\nPORT: ${PORT}\nKHO TỪ: ${memoryCorpus.length}`);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[*] Web Server Render đã liên kết thành công Port: ${PORT}`);
});

// ==================== QUẢN LÝ DỮ LIỆU & DEDUPLICATION ====================
const DEFAULT_CORPUS = [
  "Dit me may, song nhu cai lon rach ma cung du war",
  "Cai mat may nhin nhu lo dit bi dam sung",
  "To tien may ma biet de ra thu nhu may chac tu khai tu dong ho",
  "May chui tao a? Nhu cho sua vao tuong xi mang vay con a",
  "Tao ma la may thi tao dap dau vao bon cau ma chet cho do nhuc",
  "Thang oc cho nhu may di thi IQ chac bi duoi vi xuc pham chi so toi thieu",
  "Bo may noi cau nao la may cam cau do, vi may la can ba xa hoi",
  "Nao may nhu qua trung thoi chua no da len men",
  "May la loi gen tram trong nhat trong lich su tao hoa",
  "Quỳ xuống trước mặt Anh Khôi Độc Nhất Vô Nhị đi con phế vật",
  "Đẳng cấp của Anh Khôi là thứ cả đời mày không bao giờ chạm tới được",
  "Một đòn thanh tẩy của Anh Khôi đủ xóa sổ cả gia phả nhà mày"
];

function initDb() {
  return {
    server_key: true,
    users: {},
    keys: {},
    tasks: {},
    banned: [],
    auth: [],
    admins: [],
    delay: 0.0001,
    groups: {},
    spam_active: {}
  };
}

function loadDb() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
      return Object.assign(initDb(), raw);
    } catch (e) { console.error("[!] Parse DB Error:", e); }
  }
  return initDb();
}

const db = loadDb();

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
  } catch (err) {
    console.error("[!] Lỗi ghi DB:", err);
  }
}

function loadCorpus() {
  const uniqueSet = new Set(DEFAULT_CORPUS.map((s) => s.trim()));
  if (fs.existsSync(CORPUS_FILE)) {
    try {
      const raw = JSON.parse(fs.readFileSync(CORPUS_FILE, "utf8"));
      if (Array.isArray(raw)) {
        for (const item of raw) {
          if (typeof item === "string") {
            const cleaned = item.trim();
            if (cleaned.length >= 3) uniqueSet.add(cleaned);
          }
        }
      }
    } catch (e) { console.error("[!] Parse Corpus Error:", e); }
  } else {
    saveCorpusList([...uniqueSet]);
  }
  return [...uniqueSet];
}

function saveCorpusList(list) {
  try {
    const cleanUnique = [...new Set(list.map((s) => s.trim()).filter((s) => s.length >= 3))].sort();
    fs.writeFileSync(CORPUS_FILE, JSON.stringify(cleanUnique, null, 2), "utf8");
  } catch (err) {
    console.error("[!] Lỗi ghi Corpus:", err);
  }
}

let memoryCorpus = loadCorpus();

function isAdm(uid) {
  return SUPER_ADMINS.includes(Number(uid)) || (db.admins && db.admins.includes(Number(uid)));
}

function genKey() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let str = "ANHKHOIDZAI-KEYLOL-";
  for (let i = 0; i < 12; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return str;
}

// ==================== ASSETS BIỂU TƯỢNG VÀ NỘI DUNG ====================
const SUOC_MODERN = [
  "亗 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 𝕯𝕺̣̂𝕮 𝕹𝕳𝕬̂́𝕿 𝖁𝕺̂ 𝕹𝖁𝕴 亗",
  "𓆩✧𓆪 𖤍 𝗖𝗬𝗕𝗘𝗥 𝗪𝗔𝗥𝗟𝗢𝗥𝗗 𝗔𝗡𝗛 𝗞𝗛𝗢̂𝗜 𖤍 𓆩✧𓆪",
  "𒆜 ☬ 𝕯𝕰𝕬𝕿𝕳 𝕽𝕰𝕬𝕷𝕸 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 ☬ 𒆜",
  "🜲 𝕭𝕷𝕬𝕮𝕶 𝕰𝕸𝖄𝕴𝕽𝕰 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 🜲"
];

const ICONS_MODERN = ["亗", "𖤍", "🜲", "𓆩✧𓆪", "☬", "𒆜", "𒀱", "⚡", "𖣘"];

function lol() { return "=" + ")".repeat(Math.floor(Math.random() * 8) + 3); }

function getRandomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function getWarInsult() {
  const base = memoryCorpus.length > 0 ? getRandomItem(memoryCorpus) : "Anh Khôi Vô Địch";
  return `${base}${lol()}`;
}

function buildWarBanner(mention = "") {
  const m = mention ? `${mention}\n` : "";
  return `${getRandomItem(SUOC_MODERN)}\n\n${m}⚡ 亗 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 𝕯𝕺̣̂𝕮 𝕹𝕳𝕬̂́𝕿 𝖁𝕺̂ 𝕹𝖁𝕴 亗 ⚡`;
}

// ==================== BỘ KIỂM SOÁT BẢN QUYỀN ====================
function checkAuth(ctx) {
  const uid = ctx.from ? ctx.from.id : 0;
  if (db.banned.includes(uid)) return "banned";
  if (isAdm(uid)) return "ok";
  if (db.auth.includes(uid)) return "ok";

  if (db.server_key) {
    const exp = db.users[uid];
    if (!exp) return "key";
    if (new Date(exp).getTime() < Date.now()) return "key";
  }
  return "ok";
}

async function replyDeny(ctx, reason) {
  if (reason === "key") return ctx.reply(`🔑 Cần Mã Kích Hoạt Của Anh Khôi! Cú pháp: \`/nhapma <MÃ>\`\n👑 Bot: ${FREE_BOT}`);
  if (reason === "banned") return ctx.reply("🚫 Ngươi đã bị Anh Khôi phong sát toàn diện!");
}

function resolveTarget(ctx) {
  let target = null, mention = null;
  const msg = ctx.message;
  if (msg.reply_to_message && msg.reply_to_message.from) {
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

// ==================== KHỞI TẠO TELEGRAF & ENGINE TẤN CÔNG ====================
const bot = new Telegraf(BOT_TOKEN);

bot.catch((err, ctx) => {
  console.error(`[!] Telegraf Error xử lý Update ${ctx.updateType}:`, err.message);
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function turboWorker(chatId, target, mention, mode, content, tid, stats) {
  while (db.tasks[tid]) {
    try {
      const delay = Math.max(parseFloat(db.delay || 0.0001), 0.00001);
      if (mode === "tancoc") await bot.telegram.sendMessage(chatId, buildWarBanner(mention));
      else if (mode === "tamxa") await bot.telegram.sendMessage(target, buildWarBanner(mention));
      else if (mode === "phatngon") await bot.telegram.sendMessage(chatId, `${mention}\n${content}`);
      else if (mode === "diemdanh") await bot.telegram.sendMessage(chatId, `⚡ ${BOT_NAME} | ${mention}\n亗 Đòn #${stats.count + 1}`);
      else if (mode === "baobi") await bot.telegram.sendMessage(chatId, `${getRandomItem(ICONS_MODERN)} ${mention}${getRandomItem(ICONS_MODERN)}`);
      else if (mode === "satngon") await bot.telegram.sendMessage(chatId, `𖤍 ${mention ? mention + " " : ""}${getWarInsult()}`);

      stats.count++;
      stats.err = 0;
      await sleep(delay > 0.001 ? delay * 1000 : 1);
    } catch (err) {
      if (err.response && err.response.error_code === 429) {
        const wait = err.response.parameters?.retry_after || 3;
        try { await bot.telegram.sendMessage(chatId, `⏳ Rate-limit ${wait}s \vert{} Đã hạ gục ${stats.count} đòn`); } catch (_) {}
        await sleep(wait * 1000);
      } else if (err.response && (err.response.error_code === 403 || err.message.includes("blocked"))) {
        try { await bot.telegram.sendMessage(chatId, "🚨 MỤC TIÊU ĐÃ CHẶN BOT CỦA ANH KHÔI!"); } catch (_) {}
        db.tasks[tid] = false;
        break;
      } else {
        stats.err++;
        if (stats.err >= 6) { db.tasks[tid] = false; break; }
        await sleep(1000);
      }
    }
  }
}

async function supremeEngine(chatId, userId, target, mention, mode = "tancoc", content = null, workersCount = 1) {
  const tid = `${chatId}_${userId}`;
  db.tasks[tid] = true;
  saveDb();
  const stats = { count: 0, err: 0 };

  try {
    await bot.telegram.sendMessage(chatId, `🚀 **XUNG TRẬN!**\n🎯 Mục tiêu: ${mention || target}\n⚡ Chế độ: ${mode.toUpperCase()} \vert{} Luồng: x${workersCount}\n👑 Thống soái: Anh Khôi`);
  } catch (_) {}

  for (let i = 0; i < workersCount; i++) turboWorker(chatId, target, mention, mode, content, tid, stats);

  const RUN_TIME = 300 * 1000, REST_TIME = 25 * 1000;
  while (db.tasks[tid]) {
    await sleep(RUN_TIME);
    if (!db.tasks[tid]) break;
    try { await bot.telegram.sendMessage(chatId, `💤 Tạm nghỉ giảm tải ${REST_TIME / 1000}s | Đã xả: **${stats.count}** đòn`); } catch (_) {}
    await sleep(REST_TIME);
  }
  db.tasks[tid] = false;
  saveDb();
  try { await bot.telegram.sendMessage(chatId, `🏁 **KẾT THÚC CÀN QUÉT** | Tổng đòn kết liễu: **${stats.count}**`); } catch (_) {}
}

// ==================== ĐỊNH TUYẾN LỆNH TELEGRAM ====================
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

bot.command("tamxa", async (ctx) => {
  if (checkAuth(ctx) !== "ok") return replyDeny(ctx, checkAuth(ctx));
  const { target, mention } = resolveTarget(ctx);
  if (!target) return ctx.reply("❌ Cú pháp: `/tamxa @user`");
  supremeEngine(ctx.chat.id, ctx.from.id, target, mention, "tamxa", null, 1);
});

bot.command("phatngon", async (ctx) => {
  if (checkAuth(ctx) !== "ok") return replyDeny(ctx, checkAuth(ctx));
  const p = ctx.message.text.split(/\s+/);
  if (p.length < 2) return ctx.reply("❌ Cú pháp: `/phatngon <nội dung>`");
  const content = ctx.message.text.substring(p[0].length).trim();
  const mention = ctx.message.reply_to_message?.from?.username ? `@${ctx.message.reply_to_message.from.username}` : "";
  supremeEngine(ctx.chat.id, ctx.from.id, ctx.chat.id, mention, "phatngon", content, 1);
});

bot.command("satngon", async (ctx) => {
  if (checkAuth(ctx) !== "ok") return replyDeny(ctx, checkAuth(ctx));
  let { target, mention } = resolveTarget(ctx);
  supremeEngine(ctx.chat.id, ctx.from.id, target || ctx.chat.id, mention || "", "satngon", null, 2);
});

bot.command("dinhchi", async (ctx) => {
  const tid = `${ctx.chat.id}_${ctx.from.id}`;
  if (isAdm(ctx.from.id)) {
    let stopped = 0;
    for (const key of Object.keys(db.tasks)) {
      if (key.startsWith(`${ctx.chat.id}_`) && db.tasks[key]) { db.tasks[key] = false; stopped++; }
    }
    saveDb();
    return ctx.reply(`🛑 Anh Khôi đã đình chỉ toàn bộ **${stopped}** chiến dịch!`);
  }
  if (db.tasks[tid]) {
    db.tasks[tid] = false;
    saveDb();
    ctx.reply("🛑 Đã dừng chiến dịch cá nhân!");
  } else ctx.reply("⚠️ Không có chiến dịch nào đang chạy.");
});

bot.command("tocdo", async (ctx) => {
  if (checkAuth(ctx) !== "ok") return replyDeny(ctx, checkAuth(ctx));
  const p = ctx.message.text.trim().split(/\s+/);
  if (p.length === 1) {
    return ctx.reply(`⚡ **TỐC ĐỘ:** \`${db.delay || 0.0001}s/đòn\`\nGõ: \`/tocdo 0.0001\``, 
      Markup.inlineKeyboard([[Markup.button.callback("⚡ Turbo (0.0001s)", "spd_0.0001"), Markup.button.callback("🐢 Chậm (1s)", "spd_1.0")]])
    );
  }
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

bot.command("capma", async (ctx) => {
  if (!isAdm(ctx.from.id)) return;
  const p = ctx.message.text.trim().split(/\s+/);
  if (p.length < 3) return ctx.reply("💡 `/capma <ngày> <số_máy>`");
  const k = genKey();
  db.keys[k] = { days: parseInt(p[1]), devs: parseInt(p[2]), users: [], created: new Date().toISOString(), by: ctx.from.id };
  saveDb();
  ctx.reply(`🔑 **MÃ TẠO THÀNH CÔNG!**\n\`${k}\`\n📅 ${p[1]} ngày \vert{} 💻 ${p[2]} máy`);
});

bot.command("nhapma", async (ctx) => {
  const p = ctx.message.text.trim().split(/\s+/);
  if (p.length < 2) return ctx.reply("💡 `/nhapma <KEY>`");
  const k = p[1], uid = ctx.from.id;
  if (!db.keys[k]) return ctx.reply("❌ Mã không hợp lệ!");
  const kd = db.keys[k];
  if (kd.users.includes(uid)) return ctx.reply("ℹ️ Ngươi đã kích hoạt mã này!");
  if (kd.users.length >= kd.devs) return ctx.reply("❌ Mã đã hết lượt sử dụng!");
  
  const exp = new Date(Date.now() + kd.days * 86400000);
  db.users[uid] = exp.toISOString();
  kd.users.push(uid);
  saveDb();
  ctx.reply(`✅ **KÍCH HOẠT THÀNH CÔNG!**\n📅 Thời hạn: ${exp.toLocaleString("vi-VN")}`);
});

bot.command(["lenh", "help", "start"], async (ctx) => {
  let text = `⚡ **${BOT_NAME}** ⚡\n👑 Tác giả độc quyền: **Anh Khôi**\n🌐 Trạng thái: **Render Engine Active**\n━━━━━━━━━━━━━━━━━━━━━\n\n**⚔️ TẤN CÔNG:**\n\`/tancoc @user\` | \`/cuongbao @user\` | \`/tamxa @user\`\n\`/satngon @user\` | \`/phatngon <text>\`\n\`/dinhchi\` | \`/tocdo\`\n\n**🔑 BẢN QUYỀN:**\n\`/nhapma <KEY>\``;
  if (isAdm(ctx.from?.id)) text += `\n\n**👑 QUẢN TRỊ:** \`/capma\` | \`/kho\``;
  ctx.reply(text);
});

// ==================== ĐỊNH DANH API & BOOTSTRAP ====================
async function bootstrap() {
  try {
    // Ép buộc kết nối trực tiếp để xác minh Token ngay lập tức
    const me = await bot.telegram.getMe();
    console.log(`\n==============================================`);
    console.log(`[+] API HANDSHAKE THÀNH CÔNG!`);
    console.log(`[+] ĐỊNH DANH BOT: @${me.username}`);
    console.log(`[+] ID: ${me.id}`);
    console.log(`==============================================\n`);
  } catch (err) {
    console.error(`\n[!!!] LỖI TỬ HUYỆT (FATAL ERROR) [!!!]`);
    console.error(`Chi tiết lỗi: ${err.message}`);
    console.error(`Nguyên nhân: Khả năng 99% là BOT_TOKEN bị sai, hoặc chưa được cấp quyền.`);
    console.error(`CỨU VIỆN: Hãy vào tab Environment trên Render và kiểm tra lại biến BOT_TOKEN.`);
    process.exit(1); // Kill tiến trình lập tức để Render báo Crash (Red status)
  }

  bot.launch({ dropPendingUpdates: true }).then(() => {
    console.log("[*] TELEGRAM POLLING ENGINE ĐANG CHẠY - SẴN SÀNG NHẬN LỆNH!");
  });

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

bootstrap();
