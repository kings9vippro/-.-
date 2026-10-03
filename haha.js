import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8080;
const HOST = "0.0.0.0";

// ==================== CẤU HÌNH HỆ THỐNG ANH KHÔI ====================
const BOT_TOKEN = process.env.BOT_TOKEN || "8251965879:AAFHl0iLezOJrjQLxWQHeMc1RoK8ul7-K7g";
const SUPER_ADMINS = [6094686933];
const BOT_NAME = "亗 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 𝕯𝕺̣̂𝕮 𝕹𝕳𝕬̂́𝕿 𝖁𝕺̂ 𝕹𝖁𝕴 亗";
const FREE_BOT = "@AnhKhoiWar_Bot";
const PROTECTED = ["anhkhoi", "anh_khoi", "pham_anh_khoi", "dev_anh_khoi", "6094686933"];

const DB_FILE = path.join(__dirname, "anhkhoi_db.json");

// ==================== DỮ LIỆU & LƯU TRỮ (JSON DB) ====================
function defaultDB() {
  return {
    server_key: true,
    users: {},
    keys: {},
    admins: [],
    banned: [],
    delay: 0.2, // Tốc độ an toàn mặc định (giây) tránh bị 429
    stats: { totalAttacks: 0, totalMessages: 0 }
  };
}

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      return { ...defaultDB(), ...data };
    }
  } catch {}
  return defaultDB();
}

const db = loadDB();

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("[LỖI LƯU DB]:", err.message);
  }
}

function isAdmin(uid) {
  const numId = Number(uid);
  return SUPER_ADMINS.includes(numId) || db.admins.includes(numId);
}

function genKey() {
  return "AK-VIP-" + crypto.randomBytes(6).toString("hex").toUpperCase();
}

// ==================== KHO BIỂU TƯỢNG VÀ NGÔN TỪ ====================
const SUOC_MODERN = [
  "亗 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 𝕯𝕺̣̂𝕮 𝕹𝕳𝕬̂́𝕿 𝖁𝕺̂ 𝕹𝖁𝕴 亗",
  "𓆩✧𓆪 𖤍 𝗖𝗬𝗕𝗘𝗥 𝗪𝗔𝗥𝗟𝗢𝗥𝗗 𝗔𝗡𝗛 𝗞𝗛𝗢̂𝗜 𖤍 𓆩✧𓆪",
  "𒆜 ☬ 𝕯𝕰𝕬𝕿𝕳 𝕽𝕰𝕬𝕷𝕸 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 ☬ 𒆜",
  "🜲 𝕭𝕷𝕬𝕮𝕶 𝕰𝕸𝖄𝕴𝕽𝕰 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 🜲",
  "𒀱 𝕴𝕹𝕱𝕰𝕽𝕹𝕺 𝕯𝕺𝕸𝕴𝕹𝕬𝕿𝕴𝕺𝕹 𒀱",
  "𖣘 ✦ 𝕶𝕴𝕹𝕲 𝕺𝕱 𝕯𝕰𝕾𝕿𝕽𝖀𝕮𝕿𝕴𝕺𝕹 ✦ 𖣘",
  "⚡ 𓊈 𝖁𝕺̂ Đ𝕴̣𝕮𝕳 𝕿𝕳𝕴𝕰̂𝕹 𝕳𝕬̣ 𓊉 ⚡",
  "𓊈☠︎𓊉 𝕾𝖀𝕻𝕽𝕰𝕸𝕰 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 𓊈☠︎𓊉",
  "☬ 𝕭𝕷𝕺𝕺𝕯 𝕰𝖃𝕰𝕮𝖀𝕿𝕴𝕺𝕹 ☬",
  "𖤍 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 𝕿𝕺̂́𝕴 𝕮𝕬𝕺 𖤍"
];

const ICONS_MODERN = [
  "亗 𖤍 🜲", "𓆩✧𓆪 ☬ 𒆜", "𒀱 ⚡ 𖣘",
  "✦ ᯓ ⚜", "𓊈☠︎𓊉 ☣ 𖤐", "𝕬 𝕶 𝕳",
  "❖ ⚡ ☬", "𖤍 𓊈AK𓊉 亗", "🜲 ✦ 𒀱"
];

const RAW_IDEAS = [
  "Song nhu cai lon rach ma cung du war",
  "Cai mat may nhin nhu lo dit bi dam sung",
  "To tien may ma biet de ra thu nhu may chac tu khai tu dong ho",
  "May chui tao a? Nhu cho sua vao tuong xi mang vay con a",
  "Tao ma la may thi tao dap dau vao bon cau ma chet cho do nhuc",
  "Thang oc cho nhu may di thi IQ chac bi duoi vi xuc pham chi so toi thieu",
  "Bo may noi cau nao la may cam cau do, vi may la can ba xa hoi",
  "Tao tha nuoi con cho con hon nhin thay mat may them mot giay",
  "Doi may sinh ra de lam vi du cho su nhuc nha",
  "May la san pham loi ma bo me may quen xoa",
  "Cho nha tao sua con co ly hon may noi",
  "May song duoc den gio la phep mau cua y hoc",
  "Hit tho thoi may cung lam o nhiem khong khi roi",
  "Anh Khôi đang online và mày vẫn thất bại toàn diện như thường",
  "Quỳ xuống trước mặt Anh Khôi Độc Nhất Vô Nhị đi con phế vật",
  "Đẳng cấp của Anh Khôi là thứ cả đời mày không bao giờ chạm tới được",
  "Một đòn thanh tẩy của Anh Khôi đủ xóa sổ cả gia phả nhà mày"
];

function lol() {
  const n = Math.floor(Math.random() * 8) + 3;
  return "=" + ")".repeat(n);
}

function getRandomBanner(mention = "") {
  const art = SUOC_MODERN[Math.floor(Math.random() * SUOC_MODERN.length)];
  const m = mention ? `${mention}\n` : "";
  return `${art}\n\n${m}⚡ 亗 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 𝕯𝕺̣̂𝕮 𝕹𝕳𝕬̂́𝕿 𝖁𝕺̂ 𝕹𝖁𝕴 亗 ⚡`;
}

function getRandomInsult(mention = "") {
  const idea = RAW_IDEAS[Math.floor(Math.random() * RAW_IDEAS.length)];
  const m = mention ? `${mention} ` : "";
  return `𖤍 ${m}${idea} ${lol()}`;
}

// ==================== NATIVE TELEGRAM CLIENT ====================
class TelegramClient {
  constructor(token) {
    this.token = token;
    this.base = `https://api.telegram.org/bot${token}`;
    this.offset = 0;
    this.polling = false;
  }

  async call(method, data = {}) {
    if (!this.token) return null;
    try {
      const res = await fetch(`${this.base}/${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch {
      return null;
    }
  }

  async sendMessage(chatId, text, extra = {}) {
    return this.call("sendMessage", {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      ...extra
    });
  }

  async deleteMessage(chatId, messageId) {
    return this.call("deleteMessage", { chat_id: chatId, message_id: messageId });
  }

  async restrictChatMember(chatId, userId, permissions, untilDate = null) {
    const data = { chat_id: chatId, user_id: userId, permissions };
    if (untilDate) data.until_date = Math.floor(untilDate / 1000);
    return this.call("restrictChatMember", data);
  }

  async banChatMember(chatId, userId) {
    return this.call("banChatMember", { chat_id: chatId, user_id: userId });
  }

  async unbanChatMember(chatId, userId) {
    return this.call("unbanChatMember", { chat_id: chatId, user_id: userId, only_if_banned: true });
  }

  async setMyCommands(commands) {
    return this.call("setMyCommands", { commands });
  }

  async startPolling(handler) {
    if (!this.token) return;
    this.polling = true;
    console.log("[TELEGRAM] Client đã sẵn sàng lắng nghe tin nhắn!");

    try {
      await this.setMyCommands([
        { command: "start", description: "🚀 Bắt đầu & Bảng lệnh" },
        { command: "lenh", description: "📋 Xem toàn bộ danh sách lệnh" },
        { command: "tancoc", description: "⚔️ Tấn công hỏa lực nhóm" },
        { command: "cuongbao", description: "⚡ Cuồng nộ Turbo x3 luồng" },
        { command: "satngon", description: "🔥 Xả ngôn từ sát thương cao" },
        { command: "diemdanh", description: "🔢 Bão số đếm dồn dập" },
        { command: "baobi", description: "🜲 Mưa icon Cyber/Gothic" },
        { command: "dinhchi", description: "🛑 Đình chỉ toàn bộ tiến trình" },
        { command: "tocdo", description: "⚡ Tùy chỉnh vận tốc xả đòn" },
        { command: "dondep", description: "🧹 Thanh trừng tin nhắn nhóm" },
        { command: "camkhau", description: "🔇 Khóa mõm thành viên" },
        { command: "khaitro", description: "🔊 Mở cấm khẩu" },
        { command: "phongsat", description: "🚫 Phong sát vĩnh viễn" },
        { command: "capma", description: "🔑 Tạo key bản quyền (Admin)" },
        { command: "nhapma", description: "🔓 Kích hoạt mã bản quyền" },
        { command: "kiemtrama", description: "⏳ Kiểm tra hạn sử dụng" }
      ]);
    } catch {}

    while (this.polling) {
      try {
        const res = await fetch(`${this.base}/getUpdates?offset=${this.offset}&timeout=25`);
        if (res.ok) {
          const json = await res.json();
          if (json.ok && Array.isArray(json.result)) {
            for (const upd of json.result) {
              this.offset = upd.update_id + 1;
              try { await handler(upd); } catch (e) { console.error("Update error:", e); }
            }
          }
        }
      } catch {
        await new Promise((r) => setTimeout(r, 4000));
      }
    }
  }
}

const bot = new TelegramClient(BOT_TOKEN);

// ==================== ENGINE BÃO HỎA LỰC SPAM ====================
const runningTasks = new Map(); // key: chatId_userId -> boolean

async function fireSpamTask({ chatId, userId, target, mention, mode, content, workers = 1 }) {
  const taskId = `${chatId}_${userId}`;
  runningTasks.set(taskId, true);
  db.stats.totalAttacks = (db.stats.totalAttacks || 0) + 1;
  saveDB();

  await bot.sendMessage(
    chatId,
    `🚀 <b>${BOT_NAME} – XUNG TRẬN!</b>\n🎯 Mục tiêu: ${mention || target}\n⚡ Chế độ: <b>${mode.toUpperCase()}</b> | Tốc độ: <b>${db.delay}s</b> | Luồng: <b>x${workers}</b>\n👑 Thống soái: <b>Phạm Anh Khôi</b>`
  );

  let count = 0;
  const runWorker = async () => {
    while (runningTasks.get(taskId)) {
      try {
        let textToSend = "";
        if (mode === "tancoc" || mode === "tamxa") textToSend = getRandomBanner(mention);
        else if (mode === "satngon") textToSend = getRandomInsult(mention);
        else if (mode === "phatngon") textToSend = `${mention}\n${content || "亗 ANH KHÔI ĐỘC NHẤT VÔ NHỊ 亗"}`;
        else if (mode === "diemdanh") textToSend = `⚡ <b>${BOT_NAME}</b> | ${mention}\n<code>亗 Đòn #${count + 1}</code>`;
        else if (mode === "baobi") textToSend = `${ICONS_MODERN[Math.floor(Math.random() * ICONS_MODERN.length)]} ${mention}`;

        const sendTo = mode === "tamxa" ? target : chatId;
        const res = await bot.sendMessage(sendTo, textToSend);

        if (res && res.error_code === 429) {
          const waitTime = (res.parameters?.retry_after || 5) * 1000;
          await new Promise((r) => setTimeout(r, waitTime));
        } else {
          count++;
          db.stats.totalMessages = (db.stats.totalMessages || 0) + 1;
        }

        const currentDelay = Math.max(0.05, Number(db.delay) || 0.2);
        await new Promise((r) => setTimeout(r, currentDelay * 1000));
      } catch {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  };

  const pool = [];
  for (let i = 0; i < workers; i++) {
    pool.push(runWorker());
  }

  await Promise.all(pool);
  await bot.sendMessage(chatId, `🏁 <b>KẾT THÚC CÀN QUÉT</b> | Tổng lực: <b>${count}</b> đòn trừng phạt!`);
}

// ==================== BỘ ĐIỀU PHỐI LỆNH TELEGRAM ====================
async function checkAuth(msg) {
  const uid = msg.from ? msg.from.id : 0;
  if (db.banned.includes(uid)) return "banned";
  if (isAdmin(uid)) return "ok";

  if (db.server_key) {
    const exp = db.users[String(uid)];
    if (!exp) return "key";
    if (new Date(exp).getTime() < Date.now()) return "key";
  }
  return "ok";
}

function resolveTarget(msg) {
  if (msg.reply_to_message && msg.reply_to_message.from) {
    const u = msg.reply_to_message.from;
    const mention = u.username ? `@${u.username}` : `<code>${u.id}</code>`;
    return { target: u.id, mention };
  }
  const parts = (msg.text || "").trim().split(/\s+/);
  if (parts.length > 1) {
    const raw = parts[1];
    return { target: raw, mention: raw };
  }
  return { target: null, mention: null };
}

async function handleUpdate(upd) {
  if (!upd.message || !upd.message.text) return;
  const m = upd.message;
  const chatId = m.chat.id;
  const uid = m.from?.id || 0;
  const text = m.text.trim();
  const cmd = text.split(/\s+/)[0].toLowerCase().replace(`@${FREE_BOT.replace("@", "").toLowerCase()}`, "");

  // Kiểm tra quyền truy cập cơ bản
  const auth = await checkAuth(m);
  if (auth === "banned") {
    await bot.sendMessage(chatId, "🚫 <i>Ngươi đã bị Anh Khôi phong sát toàn diện!</i>");
    return;
  }

  // --- MENU CHÍNH ---
  if (cmd === "/start" || cmd === "/help" || cmd === "/lenh") {
    const menu = `⚡ <b>${BOT_NAME}</b> ⚡
👑 Tác giả: <b>Phạm Anh Khôi</b>
🌐 Hệ thống: <b>Online Render 24/7</b>
━━━━━━━━━━━━━━━━━━━━━
<b>⚔️ HỎA LỰC TẤN CÔNG:</b>
• <code>/tancoc @user</code> : Bão hỏa lực nhóm
• <code>/cuongbao @user</code> : Cuồng nộ x3 luồng cực hạn
• <code>/satngon @user</code> : Xả kho ngôn từ sát thương
• <code>/phatngon &lt;text&gt;</code> : Xả câu từ chỉ định
• <code>/diemdanh</code> : Bão số đếm thứ tự
• <code>/baobi</code> : Mưa ký tự Cyber/Gothic
• <code>/dinhchi</code> : Dừng lập tức mọi luồng tấn công
• <code>/tocdo &lt;giây&gt;</code> : Chỉnh độ trễ (VD: <code>/tocdo 0.1</code>)

<b>🏠 QUẢN LÝ ĐỊA BÀN:</b>
• <code>/dondep &lt;số&gt;</code> : Xóa nhanh tin nhắn rác
• <code>/camkhau @user [phút]</code> : Khóa mõm mục tiêu
• <code>/khaitro @user</code> : Mở khóa mõm
• <code>/phongsat @user</code> : Cấm khỏi nhóm vĩnh viễn
• <code>/giaiphong @user</code> : Gỡ lệnh cấm

<b>🔑 BẢN QUYỀN HỆ THỐNG:</b>
• <code>/nhapma &lt;KEY&gt;</code> : Kích hoạt hạn dùng
• <code>/kiemtrama</code> : Kiểm tra hạn sử dụng`;

    const adminExtra = isAdmin(uid)
      ? `\n\n<b>👑 LỆNH DÀNH RIÊNG CHO ADMIN:</b>\n• <code>/capma &lt;ngày&gt; &lt;số_máy&gt;</code> : Tạo mã key VIP`
      : "";

    await bot.sendMessage(chatId, menu + adminExtra);
    return;
  }

  // --- NHẬP MÃ BẢN QUYỀN ---
  if (cmd === "/nhapma") {
    const parts = text.split(/\s+/);
    if (parts.length < 2) {
      await bot.sendMessage(chatId, "💡 Cú pháp: <code>/nhapma &lt;MÃ_KEY&gt;</code>");
      return;
    }
    const k = parts[1].trim().toUpperCase();
    const kd = db.keys[k];
    if (!kd) {
      await bot.sendMessage(chatId, "❌ Mã bản quyền không hợp lệ!");
      return;
    }
    if (kd.users.includes(uid)) {
      await bot.sendMessage(chatId, "ℹ️ Bạn đã kích hoạt mã này trước đó!");
      return;
    }
    if (kd.users.length >= kd.devs) {
      await bot.sendMessage(chatId, "❌ Mã đã hết số lượt cho phép!");
      return;
    }
    const exp = new Date(Date.now() + kd.days * 24 * 3600 * 1000);
    db.users[String(uid)] = exp.toISOString();
    kd.users.push(uid);
    saveDB();
    await bot.sendMessage(chatId, `✅ <b>KÍCH HOẠT THÀNH CÔNG!</b>\n📅 Hạn dùng đến: <b>${exp.toLocaleString("vi-VN")}</b>`);
    return;
  }

  // --- KIỂM TRA MÃ ---
  if (cmd === "/kiemtrama") {
    if (isAdmin(uid)) {
      await bot.sendMessage(chatId, "👑 <b>Anh Khôi Tối Cao – Quyền năng vĩnh viễn!</b>");
      return;
    }
    const expStr = db.users[String(uid)];
    if (!expStr) {
      await bot.sendMessage(chatId, "❌ Bạn chưa kích hoạt mã bản quyền! Gửi <code>/nhapma &lt;KEY&gt;</code>");
      return;
    }
    const exp = new Date(expStr);
    const diff = exp.getTime() - Date.now();
    if (diff <= 0) {
      await bot.sendMessage(chatId, "⏰ Mã bản quyền của bạn đã hết hạn!");
      return;
    }
    const days = Math.floor(diff / (24 * 3600 * 1000));
    const hours = Math.floor((diff % (24 * 3600 * 1000)) / (3600 * 1000));
    await bot.sendMessage(chatId, `✅ <b>BẢN QUYỀN HỢP LỆ</b>\n📅 Hạn đến: <b>${exp.toLocaleString("vi-VN")}</b>\n⏳ Còn lại: <b>${days} ngày ${hours} giờ</b>`);
    return;
  }

  // CÁC LỆNH YÊU CẦU BẢN QUYỀN
  if (auth === "key") {
    await bot.sendMessage(chatId, `🔑 Cần Mã Kích Hoạt Của Anh Khôi!\nCú pháp: <code>/nhapma &lt;MÃ&gt;</code>\n👑 Admin hỗ trợ: ${FREE_BOT}`);
    return;
  }

  // --- CẤP MÃ (ADMIN) ---
  if (cmd === "/capma") {
    if (!isAdmin(uid)) return;
    const parts = text.split(/\s+/);
    const days = Number(parts[1]) || 1;
    const devs = Number(parts[2]) || 1;
    const note = parts.slice(3).join(" ") || "VIP";
    const k = genKey();
    db.keys[k] = { days, devs, users: [], note, createdAt: new Date().toISOString() };
    saveDB();
    await bot.sendMessage(chatId, `🔑 <b>ĐÃ TẠO MÃ BẢN QUYỀN!</b>\n<code>${k}</code>\n📅 ${days} ngày | 💻 ${devs} thiết bị | 📝 ${note}`);
    return;
  }

  // --- ĐÌNH CHỈ ---
  if (cmd === "/dinhchi") {
    const prefix = `${chatId}_`;
    let stopped = 0;
    for (const [key] of runningTasks.entries()) {
      if (isAdmin(uid) || key.startsWith(prefix)) {
        runningTasks.set(key, false);
        runningTasks.delete(key);
        stopped++;
      }
    }
    await bot.sendMessage(chatId, `🛑 <b>Đã đình chỉ thành công ${stopped} chiến dịch!</b>`);
    return;
  }

  // --- CHỈNH TỐC ĐỘ ---
  if (cmd === "/tocdo") {
    const parts = text.split(/\s+/);
    if (parts.length < 2) {
      await bot.sendMessage(chatId, `⚡ Vận tốc hiện tại: <code>${db.delay}s/đòn</code>\nThiết lập mới: <code>/tocdo 0.1</code>`);
      return;
    }
    const val = parseFloat(parts[1]);
    if (isNaN(val) || val <= 0) {
      await bot.sendMessage(chatId, "❌ Tốc độ không hợp lệ!");
      return;
    }
    db.delay = Math.max(0.05, val);
    saveDB();
    await bot.sendMessage(chatId, `✅ Đã thiết lập vận tốc mới: <b>${db.delay}s/đòn</b>`);
    return;
  }

  // --- CÁC LỆNH TẤN CÔNG ---
  if (cmd === "/tancoc" || cmd === "/cuongbao" || cmd === "/satngon" || cmd === "/diemdanh" || cmd === "/baobi" || cmd === "/phatngon") {
    const { target, mention } = resolveTarget(m);
    const isSelfTarget = cmd === "diemdanh" || cmd === "baobi";

    if (!target && !isSelfTarget) {
      await bot.sendMessage(chatId, `❌ Cú pháp: <code>${cmd} @user</code> hoặc reply tin nhắn của mục tiêu`);
      return;
    }

    // Bảo vệ các ID/tên chỉ định
    for (const p of PROTECTED) {
      if (String(target).toLowerCase().includes(p) || String(mention).toLowerCase().includes(p)) {
        await bot.sendMessage(chatId, "⚠️ <i>Mục tiêu này được bảo hộ bởi Anh Khôi, không thể tấn công!</i>");
        return;
      }
    }

    const mode = cmd.replace("/", "");
    const workers = cmd === "/cuongbao" ? 3 : (cmd === "/satngon" ? 2 : 1);
    const customContent = cmd === "/phatngon" ? text.split(/\s+/).slice(1).join(" ") : null;

    fireSpamTask({
      chatId,
      userId: uid,
      target: target || chatId,
      mention: mention || "",
      mode,
      content: customContent,
      workers
    });
    return;
  }

  // --- DỌN DẸP TIN NHẮN (DONDEP) ---
  if (cmd === "/dondep" || cmd === "/quetgon") {
    const parts = text.split(/\s+/);
    const count = Math.min(50, Math.max(1, Number(parts[1]) || 15));
    let deleted = 0;
    for (let i = 0; i <= count; i++) {
      try {
        const res = await bot.deleteMessage(chatId, m.message_id - i);
        if (res && res.ok) deleted++;
      } catch {}
    }
    const notify = await bot.sendMessage(chatId, `🧹 <i>Đã thanh trừng sạch sẽ ${deleted} tin nhắn rác!</i>`);
    setTimeout(() => {
      if (notify?.result?.message_id) bot.deleteMessage(chatId, notify.result.message_id);
    }, 2500);
    return;
  }

  // --- CẤM KHẨU (CAMKHAU) ---
  if (cmd === "/camkhau" || cmd === "/cam24h") {
    const { target } = resolveTarget(m);
    if (!target || isNaN(Number(target))) {
      await bot.sendMessage(chatId, "💡 Cú pháp: Reply tin nhắn hoặc <code>/camkhau &lt;User_ID&gt; [phút]</code>");
      return;
    }
    const mins = cmd === "/cam24h" ? 1440 : (Number(text.split(/\s+/)[2]) || 0);
    const until = mins > 0 ? Date.now() + mins * 60 * 1000 : null;
    const res = await bot.restrictChatMember(chatId, Number(target), { can_send_messages: false }, until);
    if (res && res.ok) {
      await bot.sendMessage(chatId, `🔇 Đã cấm khẩu mục tiêu (${mins ? mins + " phút" : "vĩnh viễn"})!`);
    } else {
      await bot.sendMessage(chatId, "❌ Không thể cấm khẩu. Hãy kiểm tra quyền Admin của Bot trong nhóm!");
    }
    return;
  }

  // --- KHAI TRỢ (KHAITRO) ---
  if (cmd === "/khaitro") {
    const { target } = resolveTarget(m);
    if (!target) return;
    const res = await bot.restrictChatMember(chatId, Number(target), {
      can_send_messages: true,
      can_send_media_messages: true,
      can_send_other_messages: true,
      can_add_web_page_previews: true
    });
    if (res && res.ok) {
      await bot.sendMessage(chatId, `🔊 Đã mở khóa mõm cho thành viên!`);
    }
    return;
  }

  // --- PHONG SÁT / TRỤC XUẤT ---
  if (cmd === "/phongsat" || cmd === "/trutxuat") {
    const { target } = resolveTarget(m);
    if (!target) return;
    await bot.banChatMember(chatId, Number(target));
    if (cmd === "/trutxuat") {
      await bot.unbanChatMember(chatId, Number(target));
      await bot.sendMessage(chatId, "👢 Đã trục xuất kẻ bại trận!");
    } else {
      await bot.sendMessage(chatId, "🚫 Đã phong sát vĩnh viễn!");
    }
    return;
  }

  // --- GIẢI PHÓNG ---
  if (cmd === "/giaiphong") {
    const { target } = resolveTarget(m);
    if (!target) return;
    await bot.unbanChatMember(chatId, Number(target));
    await bot.sendMessage(chatId, "✅ Đã giải phóng lệnh cấm!");
    return;
  }
}

// ==================== MÁY CHỦ HTTP GIỮ BOT LIVE TRÊN RENDER ====================
function startWebServer() {
  const server = http.createServer((req, res) => {
    const parsed = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const pathname = parsed.pathname;

    res.setHeader("Access-Control-Allow-Origin", "*");

    // Health-check endpoint
    if (pathname === "/health" || pathname === "/api/health") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({
        status: "ONLINE",
        bot: BOT_NAME,
        author: "Phạm Anh Khôi",
        uptime: process.uptime()
      }));
      return;
    }

    // Dashboard HTML
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    const userCount = Object.keys(db.users || {}).length;
    const activeTasks = runningTasks.size;
    const totalAttacks = db.stats?.totalAttacks || 0;
    const totalMsgs = db.stats?.totalMessages || 0;

    res.end(`<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${BOT_NAME} - RENDER 24/7</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background: #06060c;
    color: #f4f4f5;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 20px;
  }
  .card {
    background: #0d0d18;
    border: 1px solid rgba(239, 68, 68, 0.4);
    border-radius: 24px;
    padding: 32px;
    max-width: 520px;
    width: 100%;
    box-shadow: 0 20px 50px rgba(239, 68, 68, 0.2);
  }
  h1 {
    margin: 0 0 10px;
    font-size: 1.25rem;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .badge {
    background: #ef4444;
    color: #fff;
    font-size: 0.72rem;
    padding: 5px 14px;
    border-radius: 9999px;
    font-weight: 800;
  }
  .sub {
    color: #a1a1aa;
    font-size: 0.85rem;
    margin-bottom: 24px;
    line-height: 1.5;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 24px;
  }
  .box {
    background: #131322;
    border-radius: 16px;
    padding: 14px;
    border: 1px solid rgba(255, 255, 255, 0.06);
  }
  .box .lbl {
    font-size: 0.72rem;
    color: #71717a;
    text-transform: uppercase;
    font-weight: 800;
  }
  .box .val {
    font-size: 1.25rem;
    font-weight: 900;
    color: #ef4444;
    margin-top: 4px;
  }
  .btn {
    display: inline-block;
    width: 100%;
    text-align: center;
    background: linear-gradient(135deg, #ef4444, #b91c1c);
    color: #fff;
    text-decoration: none;
    padding: 12px 0;
    border-radius: 9999px;
    font-weight: 800;
    font-size: 0.9rem;
    transition: opacity 0.2s;
  }
  .btn:hover { opacity: 0.9; }
</style>
</head>
<body>
<div class="card">
  <h1>亗 BÃO HỎA LỰC ANH KHÔI 亗 <span class="badge">ONLINE 24/7</span></h1>
  <div class="sub">Tác giả: <b>Phạm Anh Khôi</b> · Bot: <b>${FREE_BOT}</b> · Tốc độ: <b>${db.delay}s/đòn</b></div>
  <div class="grid">
    <div class="box"><div class="lbl">Chiến Dịch Đang Chạy</div><div class="val">${activeTasks}</div></div>
    <div class="box"><div class="lbl">Tổng Đòn Đã Ra</div><div class="val">${totalMsgs}</div></div>
    <div class="box"><div class="lbl">Tổng Lượt Xung Trận</div><div class="val">${totalAttacks}</div></div>
    <div class="box"><div class="lbl">Người Dùng VIP</div><div class="val">${userCount}</div></div>
  </div>
  <a class="btn" href="https://t.me/${FREE_BOT.replace("@", "")}" target="_blank">TRẢI NGHIỆM TRÊN TELEGRAM</a>
</div>
</body>
</html>`);
  });

  server.listen(PORT, HOST, () => {
    console.log(`[HTTP SERVER] Đang phục vụ tại http://${HOST}:${PORT}`);
  });
}

// ==================== KHỞI ĐỘNG HỆ THỐNG ====================
async function bootstrap() {
  startWebServer();
  bot.startPolling(handleUpdate);
}

process.on("uncaughtException", (err) => {
  console.error("[LỖI UNCAUGHT]:", err?.message || err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[LỖI UNHANDLED]:", reason?.message || reason);
});

bootstrap();
