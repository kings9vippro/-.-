const { Telegraf, Markup } = require("telegraf");
const http = require("http");
const fs = require("fs");
const path = require("path");

// ==================== CẤU HÌNH THÔNG SỐ HỆ THỐNG ====================
const BOT_TOKEN = process.env.BOT_TOKEN || "8251965879:AAFHl0iLezOJrjQLxWQHeMc1RoK8ul7-K7g";
const PORT = parseInt(process.env.PORT || "8080", 10);
const SUPER_ADMINS = [6094686933];
const BOT_NAME = "亗 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 𝕯𝕺̣̂𝕮 𝕹𝕳𝕬̂́𝕿 𝖁𝕺̂ 𝕹𝖁𝕴 亗";
const FREE_BOT = "@AnhKhoiWar_Bot";
const PROTECTED = ["anhkhoi", "anh_khoi", "pham_anh_khoi", "dev_anh_khoi", "6094686933"];

const DB_FILE = path.join(__dirname, "anhkhoi_db.json");
const CORPUS_FILE = path.join(__dirname, "anhkhoi_corpus.json");

// ==================== KHỞI TẠO WEB SERVER (RENDER KEEP-ALIVE) ====================
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(`${BOT_NAME}\nTRẠNG THÁI: ONLINE 24/7 TRÊN RENDER\nTÁC GIẢ: ANH KHÔI\nKHO TỪ: ${memoryCorpus.length}`);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[*] Web Server Render đã liên kết thành công Port: ${PORT}`);
});

// ==================== QUẢN LÝ DỮ LIỆU & DEDUPLICATION HASH SET ====================
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
    } catch (_) {}
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
    } catch (_) {}
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

function allAdmins() {
  return [...new Set([...SUPER_ADMINS, ...(db.admins || [])])];
}

function genKey() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let str = "AK-VIP-";
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
  "🜲 𝕭𝕷𝕬𝕮𝕶 𝕰𝕸𝖄𝕴𝕽𝕰 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 🜲",
  "𒀱 𝕴𝕹𝕱𝕰𝕽𝕹𝕺 𝕯𝕺𝕸𝕴𝕹𝕬𝕿𝕴𝕺𝕹 𒀱",
  "𖣘 ✦ 𝕶𝕴𝕹𝕲 𝕺𝕱 𝕯𝕰𝕾𝕿𝕽𝖀𝕮𝕿𝕴𝕺𝕹 ✦ 𖣘",
  "⚡ 𓊈 𝖁𝕺̂ Đ𝕴̣𝕮𝕳 𝕿𝕳𝕴𝕰̂𝕹 𝕳𝕬̣ 𓊉 ⚡",
  "𖤍 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 𝕿𝕺̂́𝕴 𝕮𝕬𝕺 𖤍"
];

const ICONS_MODERN = [
  "亗 𖤍 🜲", "𓆩✧𓆪 ☬ 𒆜", "𒀱 ⚡ 𖣘",
  "✦ ᯓ ⚜", "𓊈☠︎𓊉 ☣ 𖤐", "𖤍 𓊈AK𓊉 亗", "🜲 ✦ 𒀱"
];

function lol(n) {
  const len = n || Math.floor(Math.random() * 10) + 3;
  return "=" + ")".repeat(len);
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getWarInsult() {
  const base = memoryCorpus.length > 0 ? getRandomItem(memoryCorpus) : "Sức mạnh vô đối của Anh Khôi";
  return `${base}${lol()}`;
}

function buildWarBanner(mention = "") {
  const art = getRandomItem(SUOC_MODERN);
  const m = mention ? `${mention}\n` : "";
  return `${art}\n\n${m}⚡ 亗 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 𝕯𝕺̣̂𝕮 𝕹𝕳𝕬̂́𝕿 𝖁𝕺̂ 𝕹𝖁𝕴 亗 ⚡`;
}

function buildInsultDelivery(mention = "") {
  const ins = getWarInsult();
  const m = mention ? `${mention} ` : "";
  return `𖤍 ${m}${ins}`;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
  if (reason === "key") {
    return ctx.reply(`🔑 Cần Mã Kích Hoạt Của Anh Khôi! Cú pháp: \`/nhapma <MÃ>\`\n👑 Bot: ${FREE_BOT}`);
  }
  if (reason === "banned") {
    return ctx.reply("🚫 Ngươi đã bị Anh Khôi phong sát toàn diện!");
  }
}

function resolveTarget(ctx) {
  let target = null;
  let mention = null;
  const msg = ctx.message;

  if (msg.reply_to_message && msg.reply_to_message.from) {
    const u = msg.reply_to_message.from;
    target = u.id;
    mention = u.username ? `@${u.username}` : `[${u.first_name || u.id}](tg://user?id=${u.id})`;
  } else {
    const parts = (msg.text || "").trim().split(/\s+/);
    if (parts.length > 1) {
      const raw = parts[1];
      target = raw;
      mention = raw;
      if (!raw.startsWith("@")) {
        const num = parseInt(raw, 10);
        if (!isNaN(num)) {
          target = num;
          mention = `\`${num}\``;
        }
      }
    }
  }

  if (target || mention) {
    const rawCheck = `${target}${mention}`.toLowerCase();
    for (const p of PROTECTED) {
      if (rawCheck.includes(p.toLowerCase())) {
        return { target: null, mention: null };
      }
    }
  }
  return { target, mention };
}

// ==================== KHỞI TẠO TELEGRAF CLIENT ====================
const bot = new Telegraf(BOT_TOKEN);

// ==================== PIPELINE HỎA LỰC SIÊU TỐC ====================
async function turboWorker(chatId, target, mention, mode, content, tid, stats) {
  while (db.tasks[tid]) {
    try {
      const delay = Math.max(parseFloat(db.delay || 0.0001), 0.00001);

      if (mode === "tancoc") {
        await bot.telegram.sendMessage(chatId, buildWarBanner(mention));
      } else if (mode === "tamxa") {
        await bot.telegram.sendMessage(target, buildWarBanner(mention));
      } else if (mode === "phatngon") {
        await bot.telegram.sendMessage(chatId, `${mention}\n${content}`);
      } else if (mode === "diemdanh") {
        await bot.telegram.sendMessage(chatId, `⚡ ${BOT_NAME} | ${mention}\n亗 Đòn #${stats.count + 1}`);
      } else if (mode === "baobi") {
        await bot.telegram.sendMessage(chatId, `${getRandomItem(ICONS_MODERN)} ${mention}${getRandomItem(ICONS_MODERN)}`);
      } else if (mode === "satngon") {
        await bot.telegram.sendMessage(chatId, buildInsultDelivery(mention));
      }

      stats.count++;
      stats.err = 0;
      await sleep(delay > 0.001 ? delay * 1000 : 1);
    } catch (err) {
      if (err.response && err.response.error_code === 429) {
        const wait = Math.max((err.response.parameters && err.response.parameters.retry_after) || 3, 3);
        try {
          await bot.telegram.sendMessage(chatId, `⏳ Rate-limit ${wait}s \vert{} Đã hạ gục ${stats.count} đòn`);
        } catch (_) {}
        await sleep(wait * 1000);
      } else if (err.response && (err.response.error_code === 403 || (err.message && err.message.includes("blocked")))) {
        try {
          await bot.telegram.sendMessage(chatId, "🚨 MỤC TIÊU ĐÃ CHẶN BOT CỦA ANH KHÔI!");
        } catch (_) {}
        db.tasks[tid] = false;
        db.spam_active[tid] = false;
        saveDb();
        break;
      } else {
        stats.err++;
        if (stats.err >= 6) {
          db.tasks[tid] = false;
          db.spam_active[tid] = false;
          saveDb();
          break;
        }
        await sleep(1000);
      }
    }
  }
}

async function supremeEngine(chatId, userId, target, mention, mode = "tancoc", content = null, workersCount = 1) {
  const tid = `${chatId}_${userId}`;
  db.tasks[tid] = true;
  db.spam_active[tid] = true;
  saveDb();

  const stats = { count: 0, err: 0 };
  const delay = db.delay || 0.0001;

  try {
    await bot.telegram.sendMessage(
      chatId,
      `🚀 **${BOT_NAME} – XUNG TRẬN!**\n` +
      `🎯 Mục tiêu: ${mention || target}\n` +
      `⚡ Chế độ: ${mode.toUpperCase()} | Vận tốc: ${delay}s \vert{} Luồng: x${workersCount}\n` +
      `👑 Thống soái: Anh Khôi`
    );
  } catch (_) {}

  for (let i = 0; i < workersCount; i++) {
    turboWorker(chatId, target, mention, mode, content, tid, stats);
  }

  const RUN_TIME = 300 * 1000;
  const REST_TIME = 25 * 1000;

  while (db.tasks[tid]) {
    await sleep(RUN_TIME);
    if (!db.tasks[tid]) break;

    try {
      await bot.telegram.sendMessage(chatId, `💤 Tạm nghỉ ${REST_TIME / 1000}s tránh kiểm duyệt | Đã xả: **${stats.count}** đòn`);
    } catch (_) {}

    await sleep(REST_TIME);
    try {
      await bot.telegram.sendMessage(chatId, "🔥 ANH KHÔI TIẾP TỤC TRỪNG PHẠT BÃO LỬA!");
    } catch (_) {}
  }

  db.tasks[tid] = false;
  db.spam_active[tid] = false;
  saveDb();

  try {
    await bot.telegram.sendMessage(chatId, `🏁 **KẾT THÚC CÀN QUÉT** | Tổng cộng: **${stats.count}** đòn kết liễu!`);
  } catch (_) {}
}

// ==================== ĐIỀU PHỐI LỆNH TẤN CÔNG ====================
bot.command("tancoc", async (ctx) => {
  const auth = checkAuth(ctx);
  if (auth !== "ok") return replyDeny(ctx, auth);
  const { target, mention } = resolveTarget(ctx);
  if (!target) return ctx.reply("❌ Cú pháp: `/tancoc @user` hoặc reply tin nhắn mục tiêu");
  supremeEngine(ctx.chat.id, ctx.from.id, target, mention, "tancoc", null, 1);
});

bot.command("cuongbao", async (ctx) => {
  const auth = checkAuth(ctx);
  if (auth !== "ok") return replyDeny(ctx, auth);
  const { target, mention } = resolveTarget(ctx);
  if (!target) return ctx.reply("❌ Cú pháp: `/cuongbao @user` (Chế độ cuồng bạo x3 luồng)");
  supremeEngine(ctx.chat.id, ctx.from.id, target, mention, "tancoc", null, 3);
});

bot.command("tamxa", async (ctx) => {
  const auth = checkAuth(ctx);
  if (auth !== "ok") return replyDeny(ctx, auth);
  const { target, mention } = resolveTarget(ctx);
  if (!target) return ctx.reply("❌ Cú pháp: `/tamxa @user` hoặc reply tin nhắn");
  supremeEngine(ctx.chat.id, ctx.from.id, target, mention, "tamxa", null, 1);
});

bot.command("phatngon", async (ctx) => {
  const auth = checkAuth(ctx);
  if (auth !== "ok") return replyDeny(ctx, auth);
  const p = ctx.message.text.split(/\s+/);
  if (p.length < 2) return ctx.reply("❌ Cú pháp: `/phatngon <nội dung>`");
  const content = ctx.message.text.substring(p[0].length).trim();
  const mention = ctx.message.reply_to_message && ctx.message.reply_to_message.from ? `@${ctx.message.reply_to_message.from.username || ""}` : "";
  supremeEngine(ctx.chat.id, ctx.from.id, ctx.chat.id, mention, "phatngon", content, 1);
});

bot.command("diemdanh", async (ctx) => {
  const auth = checkAuth(ctx);
  if (auth !== "ok") return replyDeny(ctx, auth);
  const mention = ctx.message.reply_to_message && ctx.message.reply_to_message.from ? `@${ctx.message.reply_to_message.from.username || ""}` : "";
  supremeEngine(ctx.chat.id, ctx.from.id, ctx.chat.id, mention, "diemdanh", null, 1);
});

bot.command("baobi", async (ctx) => {
  const auth = checkAuth(ctx);
  if (auth !== "ok") return replyDeny(ctx, auth);
  const mention = ctx.message.reply_to_message && ctx.message.reply_to_message.from ? `@${ctx.message.reply_to_message.from.username || ""}` : "";
  supremeEngine(ctx.chat.id, ctx.from.id, ctx.chat.id, mention, "baobi", null, 1);
});

bot.command("satngon", async (ctx) => {
  const auth = checkAuth(ctx);
  if (auth !== "ok") return replyDeny(ctx, auth);
  let { target, mention } = resolveTarget(ctx);
  if (!target) {
    target = ctx.chat.id;
    mention = "";
  }
  supremeEngine(ctx.chat.id, ctx.from.id, target, mention, "satngon", null, 2);
});

bot.command("dinhchi", async (ctx) => {
  const tid = `${ctx.chat.id}_${ctx.from.id}`;
  if (isAdm(ctx.from.id)) {
    let stopped = 0;
    for (const key of Object.keys(db.tasks)) {
      if (key.startsWith(`${ctx.chat.id}_`) && db.tasks[key]) {
        db.tasks[key] = false;
        stopped++;
      }
    }
    saveDb();
    return ctx.reply(`🛑 Anh Khôi đã đình chỉ toàn bộ **${stopped}** chiến dịch trong nhóm!`);
  }
  if (db.tasks[tid]) {
    db.tasks[tid] = false;
    db.spam_active[tid] = false;
    saveDb();
    ctx.reply("🛑 Đã dừng chiến dịch của bạn thành công!");
  } else {
    ctx.reply("⚠️ Không có chiến dịch nào đang chạy.");
  }
});

bot.command("tocdo", async (ctx) => {
  const auth = checkAuth(ctx);
  if (auth !== "ok") return replyDeny(ctx, auth);
  const p = ctx.message.text.trim().split(/\s+/);
  if (p.length === 1) {
    return ctx.reply(
      `⚡ **TỐC ĐỘ HỎA LỰC:** \`${db.delay || 0.0001}s/đòn\`\nChọn bên dưới hoặc gõ: \`/tocdo 0.0001\``,
      Markup.inlineKeyboard([
        [Markup.button.callback("⚡ Turbo (0.0001s)", "spd_0.0001"), Markup.button.callback("⚡ Nhanh (0.1s)", "spd_0.1")],
        [Markup.button.callback("✦ Vừa (0.5s)", "spd_0.5"), Markup.button.callback("🐢 Chậm (1s)", "spd_1.0")]
      ])
    );
  }
  const v = Math.max(parseFloat(p[1]) || 0.0001, 0.00001);
  db.delay = v;
  saveDb();
  ctx.reply(`✅ Đã thiết lập vận tốc hỏa lực: **${v}s/đòn**`);
});

bot.action(/^spd_([\d\.]+)$/, async (ctx) => {
  const v = parseFloat(ctx.match[1]);
  db.delay = v;
  saveDb();
  await ctx.answerCbQuery(`Tốc độ: ${v}s`);
  ctx.editMessageText(`✅ Thiết lập tốc độ thành công: **${v}s/đòn**`);
});

// ==================== NẠP FILE TXT & DEDUPLICATION TUYỆT ĐỐI ====================
bot.command("themngon", async (ctx) => {
  if (!isAdm(ctx.from.id)) return ctx.reply("❌ Chỉ Thống Soái mới có quyền nạp ngôn!");
  const parts = ctx.message.text.split(/\s+/);
  if (parts.length < 2) return ctx.reply("💡 Cú pháp: `/themngon Câu 1 | Câu 2 | Câu 3`");

  const rawEntries = ctx.message.text.substring(parts[0].length).trim().split("|");
  const currentSet = new Set(memoryCorpus);
  let added = 0;

  for (const item of rawEntries) {
    const cleaned = item.replace(/^\d+[\.\)\]]\s*/, "").trim();
    if (cleaned.length >= 3 && !currentSet.has(cleaned)) {
      currentSet.add(cleaned);
      added++;
    }
  }

  memoryCorpus = [...currentSet].sort();
  saveCorpusList(memoryCorpus);
  ctx.reply(`✅ **ĐÃ NẠP THÀNH CÔNG:**\n➕ Thêm mới (không trùng): \`${added}\` câu\n📚 Tổng kho hiện tại: \`${memoryCorpus.length}\` câu`);
});

bot.command("napfile", async (ctx) => {
  if (!isAdm(ctx.from.id)) return ctx.reply("❌ Chỉ Thống Soái mới có quyền nạp file!");
  await handleTxtIngestion(ctx);
});

bot.on("document", async (ctx) => {
  const caption = ctx.message.caption || "";
  if (caption.includes("/napfile") || caption.includes("napfile")) {
    if (!isAdm(ctx.from.id)) return;
    await handleTxtIngestion(ctx);
  }
});

async function handleTxtIngestion(ctx) {
  let doc = ctx.message.document;
  if (!doc && ctx.message.reply_to_message && ctx.message.reply_to_message.document) {
    doc = ctx.message.reply_to_message.document;
  }

  if (!doc || !doc.file_name.toLowerCase().endsWith(".txt")) {
    return ctx.reply("💡 Gửi file `.txt` kèm caption `/napfile` hoặc reply file `.txt` bằng lệnh `/napfile`.");
  }

  const statusMsg = await ctx.reply("⏳ Đang tải tệp và thực thi Hash Deduplication...");

  try {
    const link = await ctx.telegram.getFileLink(doc.file_id);
    const response = await fetch(link.href);
    const text = await response.text();

    const lines = text.split(/\r?\n/);
    const currentSet = new Set(memoryCorpus);
    const initialCount = currentSet.size;

    for (const line of lines) {
      const cleaned = line.replace(/^\d+[\.\)\]]\s*/, "").trim();
      if (cleaned.length >= 3) {
        currentSet.add(cleaned);
      }
    }

    const added = currentSet.size - initialCount;
    memoryCorpus = [...currentSet].sort();
    saveCorpusList(memoryCorpus);

    await ctx.telegram.editMessageText(
      ctx.chat.id,
      statusMsg.message_id,
      undefined,
      `✅ **XỬ LÝ FILE TXT HOÀN TẤT!**\n` +
      `📄 Tên file: \`${doc.file_name}\`\n` +
      `📥 Tổng dòng quét: \`${lines.length}\`\n` +
      `✨ Thêm mới (loại trùng tuyệt đối): \`${added}\` câu\n` +
      `📊 Tổng kho từ vựng hiện tại: \`${memoryCorpus.length}\` câu`
    );
  } catch (err) {
    await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, undefined, `❌ Thất bại: ${err.message}`);
  }
}

bot.command("kho", async (ctx) => {
  const auth = checkAuth(ctx);
  if (auth !== "ok") return replyDeny(ctx, auth);

  const total = memoryCorpus.length;
  const sample = memoryCorpus.slice(0, 5).map((x) => `• ${x}`).join("\n");
  ctx.reply(
    `📊 **KHO VŨ KHÍ TỪ VỰNG ANH KHÔI**\n` +
    `Tổng số câu độc nhất: \`${total}\`\n\n` +
    `🔍 **Mẫu trích xuất:**\n${sample || "Chưa có dữ liệu"}\n\n` +
    `💡 Thêm mới: \`/themngon\` hoặc gửi file \`.txt\` kèm \`/napfile\``
  );
});

bot.command("xoangon", async (ctx) => {
  if (!isAdm(ctx.from.id)) return ctx.reply("❌ Quyền hạn bị từ chối!");
  const p = ctx.message.text.trim().split(/\s+/);
  if (p.length < 2) return ctx.reply("💡 Cú pháp: `/xoangon <từ_khóa>`");

  const kw = p.slice(1).join(" ").toLowerCase();
  const before = memoryCorpus.length;
  memoryCorpus = memoryCorpus.filter((x) => !x.toLowerCase().includes(kw));
  const removed = before - memoryCorpus.length;
  saveCorpusList(memoryCorpus);

  ctx.reply(`🗑 Đã xóa sạch \`${removed}\` câu chứa từ khóa \`${kw}\`. Còn lại: \`${memoryCorpus.length}\` câu.`);
});

// ==================== QUẢN LÝ NHÓM & BẢN QUYỀN ====================
bot.command(["dondep", "quetgon"], async (ctx) => {
  const auth = checkAuth(ctx);
  if (auth !== "ok") return replyDeny(ctx, auth);
  const p = ctx.message.text.trim().split(/\s+/);
  let count = parseInt(p[1], 10) || 20;
  count = Math.min(Math.max(count, 1), 100);

  const startId = ctx.message.message_id;
  let deleted = 0;

  for (let i = 0; i <= count; i++) {
    try {
      await ctx.telegram.deleteMessage(ctx.chat.id, startId - i);
      deleted++;
    } catch (_) {}
  }

  const n = await ctx.reply(`🧹 Anh Khôi đã thanh trừng sạch sẽ **${deleted}** tin nhắn!`);
  setTimeout(() => {
    ctx.telegram.deleteMessage(ctx.chat.id, n.message_id).catch(() => {});
  }, 3000);
});

bot.command("camkhau", async (ctx) => {
  const auth = checkAuth(ctx);
  if (auth !== "ok") return replyDeny(ctx, auth);
  const { target } = resolveTarget(ctx);
  if (!target || isAdm(target)) return ctx.reply("💡 Cú pháp: `/camkhau @user [phút]`");

  const p = ctx.message.text.trim().split(/\s+/);
  const mins = parseInt(p[2], 10) || 0;
  const until = mins > 0 ? Math.floor(Date.now() / 1000) + mins * 60 : 0;

  try {
    await ctx.telegram.restrictChatMember(ctx.chat.id, Number(target), {
      permissions: { can_send_messages: false },
      until_date: until
    });
    ctx.reply(`🔇 Đã cấm khẩu thành công (${mins ? `${mins} phút` : "Vĩnh viễn"})!`);
  } catch (err) {
    ctx.reply(`❌ Lỗi quyền hạn: ${err.message}`);
  }
});

bot.command("khaitro", async (ctx) => {
  const auth = checkAuth(ctx);
  if (auth !== "ok") return replyDeny(ctx, auth);
  const { target } = resolveTarget(ctx);
  if (!target) return ctx.reply("💡 Cú pháp: `/khaitro @user`");

  try {
    await ctx.telegram.restrictChatMember(ctx.chat.id, Number(target), {
      permissions: {
        can_send_messages: true,
        can_send_media_messages: true,
        can_send_other_messages: true,
        can_add_web_page_previews: true
      }
    });
    ctx.reply("🔊 Đã khai khẩu cho đối tượng!");
  } catch (err) {
    ctx.reply(`❌ Lỗi: ${err.message}`);
  }
});

bot.command("trutxuat", async (ctx) => {
  const auth = checkAuth(ctx);
  if (auth !== "ok") return replyDeny(ctx, auth);
  const { target } = resolveTarget(ctx);
  if (!target || isAdm(target)) return;
  try {
    await ctx.telegram.banChatMember(ctx.chat.id, Number(target));
    await ctx.telegram.unbanChatMember(ctx.chat.id, Number(target));
    ctx.reply("👢 Đã trục xuất kẻ bại trận khỏi địa bàn!");
  } catch (err) {
    ctx.reply(`❌ Lỗi: ${err.message}`);
  }
});

bot.command("phongsat", async (ctx) => {
  const auth = checkAuth(ctx);
  if (auth !== "ok") return replyDeny(ctx, auth);
  const { target } = resolveTarget(ctx);
  if (!target || isAdm(target)) return;
  try {
    await ctx.telegram.banChatMember(ctx.chat.id, Number(target));
    ctx.reply("🚫 Đã phong sát vĩnh viễn mục tiêu!");
  } catch (err) {
    ctx.reply(`❌ Lỗi: ${err.message}`);
  }
});

bot.command("capma", async (ctx) => {
  if (!isAdm(ctx.from.id)) return;
  const p = ctx.message.text.trim().split(/\s+/);
  if (p.length < 3) return ctx.reply("💡 Cú pháp: `/capma <ngày> <số_máy> [ghi chú]`");

  const days = parseInt(p[1], 10);
  const devs = parseInt(p[2], 10);
  const note = p.slice(3).join(" ") || "-";
  const k = genKey();

  db.keys[k] = {
    days,
    devs,
    users: [],
    note,
    created: new Date().toISOString(),
    by: ctx.from.id
  };
  saveDb();
  ctx.reply(`🔑 **MÃ ĐÃ TẠO BỞI ANH KHÔI!**\n\`${k}\`\n📅 ${days} ngày | 💻 ${devs} máy \vert{} 📝 ${note}`);
});

bot.command("nhapma", async (ctx) => {
  const p = ctx.message.text.trim().split(/\s+/);
  const uid = ctx.from.id;
  if (p.length < 2) return ctx.reply("💡 Cú pháp: `/nhapma <KEY>`");

  const k = p[1];
  if (!db.keys[k]) return ctx.reply("❌ Mã không hợp lệ!");
  const kd = db.keys[k];

  if (kd.users.includes(uid)) return ctx.reply("ℹ️ Ngươi đã kích hoạt mã này trước đó!");
  if (kd.users.length >= kd.devs) return ctx.reply("❌ Mã đã hết lượt sử dụng!");

  const exp = new Date(Date.now() + kd.days * 24 * 60 * 60 * 1000);
  db.users[uid] = exp.toISOString();
  kd.users.push(uid);
  saveDb();
  ctx.reply(`✅ **KÍCH HOẠT THÀNH CÔNG!**\n📅 Thời hạn: ${exp.toLocaleString("vi-VN")}`);
});

bot.command("kiemtrama", async (ctx) => {
  const uid = ctx.from.id;
  if (isAdm(uid)) return ctx.reply("👑 Anh Khôi Tối Cao – Quyền năng vĩnh cửu!");
  const exp = db.users[uid];
  if (!exp) return ctx.reply("❌ Ngươi chưa sở hữu mã bản quyền!");

  const rem = new Date(exp).getTime() - Date.now();
  if (rem < 0) return ctx.reply("⏰ Mã đã hết hạn!");
  const days = Math.floor(rem / (1000 * 60 * 60 * 24));
  const hours = Math.floor((rem % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  ctx.reply(`✅ **BẢN QUYỀN HỢP LỆ**\n📅 Hạn dùng: ${new Date(exp).toLocaleString("vi-VN")}\n⏳ Còn: ${days} ngày ${hours} giờ`);
});

bot.command(["lenh", "help", "start"], async (ctx) => {
  const uid = ctx.from ? ctx.from.id : 0;
  let text =
    `⚡ **${BOT_NAME}** ⚡\n` +
    `👑 Tác giả độc quyền: **Anh Khôi**\n` +
    `🌐 Trạng thái: **Chạy Render Node.js 24/7**\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `**⚔️ HỎA LỰC TẤN CÔNG:**\n` +
    `\`/tancoc @user\` — Bão hỏa lực nhóm\n` +
    `\`/cuongbao @user\` — Cuồng nộ x3 luồng cực hạn\n` +
    `\`/tamxa @user\` — Bắn phá DM riêng\n` +
    `\`/phatngon <text>\` — Xả văn bản chỉ định\n` +
    `\`/diemdanh\` — Bão số đếm\n` +
    `\`/baobi\` — Mưa icon Cyber/Gothic\n` +
    `\`/satngon @user\` — Xả ngôn từ sát thương cao\n` +
    `\`/dinhchi\` — Dừng toàn bộ hỏa lực\n` +
    `\`/tocdo\` — Chỉnh mili-giây\n\n` +
    `**📚 QUẢN LÝ KHO NGÔN:**\n` +
    `\`/kho\` — Thống kê kho từ vựng\n` +
    `\`/themngon <câu 1 | câu 2>\` — Thêm thủ công\n` +
    `\`/napfile\` — Reply hoặc gửi file .txt (Tự khử trùng lặp)\n` +
    `\`/xoangon <từ khóa>\` — Lọc xóa câu từ kho\n\n` +
    `**🏠 QUẢN TRỊ & BẢN QUYỀN:**\n` +
    `\`/dondep <số>\` — Dọn sạch tin nhắn\n` +
    `\`/camkhau @user [phút]\` — Cấm khẩu\n` +
    `\`/khaitro @user\` — Mở cấm khẩu\n` +
    `\`/trutxuat @user\` — Đuổi thành viên\n` +
    `\`/phongsat @user\` — Ban vĩnh viễn\n` +
    `\`/nhapma <MÃ>\` — Kích hoạt quyền\n` +
    `\`/kiemtrama\` — Xem hạn dùng`;

  if (isAdm(uid)) {
    text += `\n\n**👑 QUẢN TRỊ VIÊN:** \`/capma\``;
  }
  ctx.reply(text);
});

// ==================== KHỞI ĐỘNG HỆ THỐNG ====================
async function bootstrap() {
  try {
    await bot.telegram.setMyCommands([
      { command: "lenh", description: "Danh sách lệnh" },
      { command: "tancoc", description: "Bão hỏa lực nhóm" },
      { command: "cuongbao", description: "Cuồng nộ x3 luồng" },
      { command: "tamxa", description: "Bắn phá tin nhắn riêng" },
      { command: "phatngon", description: "Xả văn bản chỉ định" },
      { command: "diemdanh", description: "Bão số đếm" },
      { command: "baobi", description: "Mưa icon Cyber" },
      { command: "satngon", description: "Xả kho ngôn từ" },
      { command: "kho", description: "Thống kê kho ngôn" },
      { command: "dinhchi", description: "Dừng tấn công" },
      { command: "tocdo", description: "Thiết lập vận tốc" },
      { command: "dondep", description: "Thanh trừng tin nhắn" },
      { command: "nhapma", description: "Nhập mã bản quyền" },
      { command: "kiemtrama", description: "Kiểm tra thời hạn" }
    ]);
  } catch (_) {}

  bot.launch({ dropPendingUpdates: true }).then(() => {
    console.log("[*] Telegram Bot Anh Khôi đã sẵn sàng tham chiến trên Render!");
  });

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

bootstrap();
