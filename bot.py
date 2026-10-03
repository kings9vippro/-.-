import asyncio
import json
import os
import random
import re
import string
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from aiohttp import web
from pyrogram import Client, filters, idle
from pyrogram.types import (
    BotCommand, ChatPermissions, Message,
    InlineKeyboardMarkup, InlineKeyboardButton, CallbackQuery
)
from pyrogram.errors import (
    FloodWait, UserIsBlocked, RPCError,
    PeerIdInvalid, ChatAdminRequired, BadRequest
)

# Kích hoạt uvloop để tối ưu event loop trên Linux của Render
if sys.platform != "win32":
    try:
        import uvloop
        uvloop.install()
    except ImportError:
        pass

# ==================== CẤU HÌNH HỆ THỐNG ====================
API_ID       = int(os.environ.get("API_ID", 32906102))
API_HASH     = os.environ.get("API_HASH", "9fc3add5b6bf34cc5335a85388f34a0f")
BOT_TOKEN    = os.environ.get("BOT_TOKEN", "8251965879:AAFHl0iLezOJrjQLxWQHeMc1RoK8ul7-K7g")

# Điền Telegram ID số của bạn vào đây (hoặc truyền qua biến môi trường)
SUPER_ADMINS = [int(x) for x in os.environ.get("SUPER_ADMINS", "6094686933").split() if x.isdigit()]
BOT_NAME     = "亗 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 𝕯𝕺̣̂𝕮 𝕹𝕳𝕬̂́𝕿 𝖁𝕺̂ 𝕹𝖁𝕴 亗"
FREE_BOT     = "@AnhKhoiWar_Bot"

MUST_JOIN    = []
BANNED_CHATS = []
PROTECTED    = ["anhkhoi", "anh_khoi", "pham_anh_khoi", "dev_anh_khoi"] + [str(x) for x in SUPER_ADMINS]

DB_FILE      = "anhkhoi_db.json"
INSF_FILE    = "anhkhoi_insults.json"
EXTERNAL_TXT = "idea.txt"

# ==================== WEB SERVER CHO RENDER ====================
async def web_health(request):
    return web.Response(
        text=f"{BOT_NAME}\nSTATUS: ONLINE 24/7 TRÊN RENDER",
        status=200,
        content_type="text/plain; charset=utf-8"
    )

async def start_render_web_server():
    port = int(os.environ.get("PORT", 8080))
    app_web = web.Application()
    app_web.router.add_get("/", web_health)
    app_web.router.add_get("/health", web_health)
    runner = web.AppRunner(app_web)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", port)
    await site.start()
    print(f"[*] Render Web Server đã mở Port: {port}")

# ==================== QUẢN LÝ DỮ LIỆU ====================
def _ddb():
    # server_key mặc định để False để bot nhận lệnh ngay, bật True nếu muốn bắt buộc nhập mã
    return dict(server_key=False, users={}, keys={}, tasks={},
                banned=[], auth=[], admins=[], delay=0.5,
                groups={}, refs={}, ref_claimed={}, spam_active={})

def ldb():
    if Path(DB_FILE).exists():
        try:
            d = json.loads(Path(DB_FILE).read_text("utf-8"))
            b = _ddb()
            b.update(d)
            b["users"]       = {int(k): v for k, v in b.get("users", {}).items()}
            b["banned"]      = [int(x) for x in b.get("banned", [])]
            b["auth"]        = [int(x) for x in b.get("auth", [])]
            b["admins"]      = [int(x) for x in b.get("admins", [])]
            return b
        except Exception:
            pass
    return _ddb()

def sdb():
    out = dict(db)
    out["users"] = {str(k): v for k, v in db["users"].items()}
    Path(DB_FILE).write_text(json.dumps(out, ensure_ascii=False, indent=2), "utf-8")

db = ldb()
def all_adm(): return list(set(SUPER_ADMINS + [x for x in db["admins"]]))
def is_adm(u): return u in all_adm()

# ==================== DANH SÁCH TEXT & BIỂU TƯỢNG ====================
SUOC_MODERN = [
    "亗 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 𝕯𝕺̣̂𝕮 𝕹𝕳𝕬̂́𝕿 𝖁𝕺̂ 𝕹𝖁𝕴 亗",
    "𓆩✧𓆪 𖤍 𝗖𝗬𝗕𝗘𝗥 𝗪𝗔𝗥𝗟𝗢𝗥𝗗 𝗔𝗡𝗛 𝗞𝗛𝗢̂𝗜 𖤍 𓆩✧𓆪",
    "𒆜 ☬ 𝕯𝕰𝕬𝕿𝕳 𝕽𝕰𝕬𝕷𝕸 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 ☬ 𒆜",
    "🜲 𝕭𝕷𝕬𝕮𝕶 𝕰𝕸𝖄𝕴𝕽𝕰 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 🜲",
    "⚡ 𓊈 𝖁𝕺̂ Đ𝕴̣𝕮𝕳 𝕿𝕳𝕴𝕰̂𝕹 𝕳𝕬̣ 𓊉 ⚡"
]

ICONS_MODERN = [
    "亗 𖤍 🜲", "𓆩✧𓆪 ☬ 𒆜", "𒀱 ⚡ 𖣘",
    "✦ ᯓ ⚜", "𓊈☠︎𓊉 ☣ 𖤐", "𝕬 𝕶 𝕳"
]

RAW_IDEAS_SOURCE = [
    "Đẳng cấp của Anh Khôi là thứ bạn không thể chạm tới!",
    "Bão lửa năng lượng cao càn quét toàn bộ khu vực!",
    "Chiến hạm tối cao kích hoạt hỏa lực toàn diện!",
    "Áp đảo tuyệt đối, không một ai có thể ngăn cản!",
    "Thanh trừng diện rộng, thiết lập trật tự địa bàn!"
]

def load_all_ideas():
    unique = list(dict.fromkeys(RAW_IDEAS_SOURCE))
    for pth in [EXTERNAL_TXT, "100.000 ngôn idea hqh.txt"]:
        p = Path(pth)
        if p.exists():
            try:
                for line in p.read_text("utf-8", errors="ignore").splitlines():
                    cleaned = re.sub(r"^\d+[\.\)]\s*", "", line).strip()
                    if len(cleaned) > 4 and cleaned not in unique:
                        unique.append(cleaned)
            except Exception:
                pass
    return unique

IDEAS_CORPUS = load_all_ideas()

def get_war_insult():
    return random.choice(IDEAS_CORPUS)

def build_war_banner(mention=""):
    art = random.choice(SUOC_MODERN)
    m = f"{mention}\n" if mention else ""
    return f"{art}\n\n{m}⚡ 亗 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 𝕯𝕺̣̂𝕮 𝕹𝕳𝕬̂́𝕿 𝖁𝕺̂ 𝕹𝖁𝕴 亗 ⚡"

def build_insult_delivery(mention=""):
    ins = get_war_insult()
    m = f"{mention} " if mention else ""
    return f"𖤍 {m}{ins}"

# ==================== KHỞI TẠO CLIENT ====================
app = Client(
    "AnhKhoi_War_Supreme",
    api_id=API_ID,
    api_hash=API_HASH,
    bot_token=BOT_TOKEN
)

def gen_key():
    return "AK-VIP-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=12))

async def chk(msg: Message):
    uid = msg.from_user.id if msg.from_user else 0
    if uid in db["banned"]: return "banned"
    if is_adm(uid): return "ok"
    
    cid = str(msg.chat.id)
    if cid in db.get("banned_chats", []) or getattr(msg.chat, "username", "") in BANNED_CHATS:
        return "pc"
    if uid in db["auth"]: return "ok"
    
    for g in MUST_JOIN:
        try:
            await app.get_chat_member(g, uid)
        except Exception:
            return "join"
            
    if db.get("server_key", False):
        exp = db["users"].get(uid)
        if not exp: return "key"
        try:
            if datetime.fromisoformat(str(exp)) < datetime.now(): return "key"
        except Exception:
            return "key"
    return "ok"

async def deny(msg, r):
    if r == "join":
        gs = "\n".join(f"• t.me/{g}" for g in MUST_JOIN)
        await msg.reply(f"❌ Yêu cầu tham gia kênh:\n{gs}\n\n👑 Bot: {FREE_BOT}")
    elif r == "key":
        await msg.reply(f"🔑 Cần Mã Kích Hoạt! Cú pháp: `/nhapma <MÃ>`\n👑 Bot: {FREE_BOT}")
    elif r == "banned":
        await msg.reply("🚫 Bạn đã bị chặn sử dụng bot!")

async def resolve(msg: Message):
    tgt = mention = None
    if msg.reply_to_message and msg.reply_to_message.from_user:
        u = msg.reply_to_message.from_user
        tgt = u.id
        mention = u.mention
    else:
        p = msg.text.split()
        if len(p) > 1:
            raw = p[1]
            tgt = raw
            mention = raw
            if not raw.startswith("@"):
                try:
                    tgt = int(raw)
                    mention = f"`{raw}`"
                except Exception:
                    pass
    for n in PROTECTED:
        if n in str(mention).lower() or n in str(tgt).lower():
            return None, None
    return tgt, mention

# ==================== ĐỘNG CƠ XỬ LÝ LỆNH ====================
async def turbo_worker(chat_id, target, mention, mode, content, tid, stats):
    while db["tasks"].get(tid):
        delay = max(float(db.get("delay", 0.5)), 0.3)
        try:
            if mode == "tancoc":
                await app.send_message(chat_id, build_war_banner(mention))
            elif mode == "tamxa":
                await app.send_message(target, build_war_banner(mention))
            elif mode == "phatngon":
                await app.send_message(chat_id, f"{mention}\n{content}")
            elif mode == "diemdanh":
                await app.send_message(chat_id, f"⚡ **{BOT_NAME}** | {mention}\n`亗 Đòn #{stats['count']+1}`")
            elif mode == "baobi":
                await app.send_message(chat_id, f"{random.choice(ICONS_MODERN)} {mention} {random.choice(ICONS_MODERN)}")
            elif mode == "satngon":
                await app.send_message(chat_id, build_insult_delivery(mention))
            
            stats["count"] += 1
            stats["err"] = 0
            await asyncio.sleep(delay)
        except FloodWait as e:
            w = max(e.value, 3)
            await asyncio.sleep(w)
        except UserIsBlocked:
            db["tasks"][tid] = False
            sdb()
            break
        except (PeerIdInvalid, BadRequest):
            stats["err"] += 1
            if stats["err"] >= 5:
                db["tasks"][tid] = False
                sdb()
                break
            await asyncio.sleep(1)
        except RPCError:
            stats["err"] += 1
            await asyncio.sleep(1.5)

async def supreme_engine(chat_id, user_id, target, mention, mode="tancoc", content=None, workers_count=1):
    tid = f"{chat_id}_{user_id}"
    db["tasks"][tid] = True
    db["spam_active"][tid] = True
    sdb()
    
    stats = {"count": 0, "err": 0}
    delay = db.get("delay", 0.5)
    
    try:
        await app.send_message(
            chat_id,
            f"🚀 **{BOT_NAME} – XUNG TRẬN!**\n"
            f"🎯 Mục tiêu: {mention or target}\n"
            f"⚡ Chế độ: {mode.upper()} · Tốc độ: {delay}s | Luồng: x{workers_count}"
        )
    except Exception:
        pass

    tasks = [
        asyncio.create_task(turbo_worker(chat_id, target, mention, mode, content, tid, stats))
        for _ in range(workers_count)
    ]

    while db["tasks"].get(tid):
        await asyncio.sleep(180)
        if not db["tasks"].get(tid): break
        await asyncio.sleep(15)

    db["tasks"][tid] = False
    sdb()
    for t in tasks:
        if not t.done(): t.cancel()
        
    try:
        await app.send_message(chat_id, f"🏁 **KẾT THÚC** | Tổng cộng: **{stats['count']}** lần phát lệnh!")
    except Exception:
        pass

# ==================== DANH SÁCH LỆNH COMMANDS ====================
@app.on_message(filters.command("tancoc"))
async def cmd_tancoc(_, m):
    if (r := await chk(m)) != "ok": return await deny(m, r)
    t, mn = await resolve(m)
    if not t: return await m.reply("❌ Cú pháp: `/tancoc @user` hoặc reply tin nhắn")
    asyncio.create_task(supreme_engine(m.chat.id, m.from_user.id, t, mn, "tancoc", workers_count=1))

@app.on_message(filters.command("cuongbao"))
async def cmd_cuongbao(_, m):
    if (r := await chk(m)) != "ok": return await deny(m, r)
    t, mn = await resolve(m)
    if not t: return await m.reply("❌ Cú pháp: `/cuongbao @user`")
    asyncio.create_task(supreme_engine(m.chat.id, m.from_user.id, t, mn, "tancoc", workers_count=2))

@app.on_message(filters.command("tamxa"))
async def cmd_tamxa(_, m):
    if (r := await chk(m)) != "ok": return await deny(m, r)
    t, mn = await resolve(m)
    if not t: return await m.reply("❌ Cú pháp: `/tamxa @user` hoặc reply")
    asyncio.create_task(supreme_engine(m.chat.id, m.from_user.id, t, mn, "tamxa", workers_count=1))

@app.on_message(filters.command("phatngon"))
async def cmd_phatngon(_, m):
    if (r := await chk(m)) != "ok": return await deny(m, r)
    p = m.text.split(None, 1)
    if len(p) < 2: return await m.reply("❌ Cú pháp: `/phatngon <nội dung>`")
    mn = m.reply_to_message.from_user.mention if (m.reply_to_message and m.reply_to_message.from_user) else ""
    asyncio.create_task(supreme_engine(m.chat.id, m.from_user.id, m.chat.id, mn, "phatngon", content=p[1]))

@app.on_message(filters.command("diemdanh"))
async def cmd_diemdanh(_, m):
    if (r := await chk(m)) != "ok": return await deny(m, r)
    mn = m.reply_to_message.from_user.mention if (m.reply_to_message and m.reply_to_message.from_user) else ""
    asyncio.create_task(supreme_engine(m.chat.id, m.from_user.id, m.chat.id, mn, "diemdanh"))

@app.on_message(filters.command("baobi"))
async def cmd_baobi(_, m):
    if (r := await chk(m)) != "ok": return await deny(m, r)
    mn = m.reply_to_message.from_user.mention if (m.reply_to_message and m.reply_to_message.from_user) else ""
    asyncio.create_task(supreme_engine(m.chat.id, m.from_user.id, m.chat.id, mn, "baobi"))

@app.on_message(filters.command("satngon"))
async def cmd_satngon(_, m):
    if (r := await chk(m)) != "ok": return await deny(m, r)
    t, mn = await resolve(m)
    if not t: t = m.chat.id; mn = ""
    asyncio.create_task(supreme_engine(m.chat.id, m.from_user.id, t, mn, "satngon", workers_count=1))

@app.on_message(filters.command("dinhchi"))
async def cmd_dinhchi(_, m):
    tid = f"{m.chat.id}_{m.from_user.id}"
    if is_adm(m.from_user.id):
        stopped = 0
        for k in list(db["tasks"]):
            if str(m.chat.id) in k and db["tasks"][k]:
                db["tasks"][k] = False
                stopped += 1
        sdb()
        return await m.reply(f"🛑 Đã dừng toàn bộ **{stopped}** tiến trình!")
    if db["tasks"].get(tid):
        db["tasks"][tid] = False
        sdb()
        await m.reply("🛑 Đã dừng chiến dịch của bạn!")
    else:
        await m.reply("⚠️ Không có tiến trình nào đang chạy.")

@app.on_message(filters.command("tocdo"))
async def cmd_tocdo(_, m):
    if (r := await chk(m)) != "ok": return await deny(m, r)
    p = m.text.split()
    if len(p) == 1:
        return await m.reply(f"⚡ Tốc độ hiện tại: `{db.get('delay', 0.5)}s/tin` (Tối thiểu khuyên dùng 0.3s để tránh bị cấm)")
    try:
        v = max(float(p[1]), 0.2)
        db["delay"] = v
        sdb()
        await m.reply(f"✅ Đã đặt tốc độ: **{v}s/tin**")
    except ValueError:
        await m.reply("❌ Vui lòng nhập số hợp lệ!")

@app.on_message(filters.command("keymode"))
async def cmd_keymode(_, m):
    if not is_adm(m.from_user.id): return
    p = m.text.split()
    if len(p) < 2:
        return await m.reply(f"ℹ️ Trạng thái xác thực mã: `{'BẬT' if db.get('server_key') else 'TẮT'}`\nDùng: `/keymode on` hoặc `/keymode off`")
    db["server_key"] = (p[1].lower() == "on")
    sdb()
    await m.reply(f"✅ Chế độ kiểm tra mã hiện đang: **{'BẬT' if db['server_key'] else 'TẮT'}**")

@app.on_message(filters.command("capma"))
async def cmd_capma(_, m):
    if not is_adm(m.from_user.id): return
    try:
        p = m.text.split()
        days = int(p[1])
        devs = int(p[2])
        note = " ".join(p[3:]) if len(p) > 3 else ""
        k = gen_key()
        db["keys"][k] = {"days": days, "devs": devs, "users": [], "note": note}
        sdb()
        await m.reply(f"🔑 **MÃ ĐÃ TẠO:**\n`{k}`\n📅 {days} ngày | 💻 {devs} người dùng")
    except Exception:
        await m.reply("💡 Cú pháp: `/capma <ngày> <số_lượng_dùng> [ghi chú]`")

@app.on_message(filters.command("nhapma"))
async def cmd_nhapma(_, m):
    p = m.text.split()
    uid = m.from_user.id
    if len(p) < 2: return await m.reply("💡 Cú pháp: `/nhapma <KEY>`")
    k = p[1]
    if k not in db["keys"]: return await m.reply("❌ Mã không hợp lệ!")
    kd = db["keys"][k]
    if uid in kd["users"]: return await m.reply("ℹ️ Bạn đã kích hoạt mã này rồi!")
    if len(kd["users"]) >= kd["devs"]: return await m.reply("❌ Mã đã hết lượt sử dụng!")
    exp = datetime.now() + timedelta(days=kd["days"])
    db["users"][uid] = exp.isoformat()
    kd["users"].append(uid)
    sdb()
    await m.reply(f"✅ **KÍCH HOẠT THÀNH CÔNG!**\n📅 Thời hạn đến: {exp.strftime('%d/%m/%Y %H:%M')}")

@app.on_message(filters.command(["lenh", "help", "start"]))
async def cmd_lenh(_, m):
    base = (
        f"⚡ **{BOT_NAME}** ⚡\n"
        f"🌐 **Trạng thái: Hoạt động ổn định trên Render**\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n\n"
        f"**⚔️ DANH SÁCH LỆNH:**\n"
        f"`/tancoc @user` — Tấn công mục tiêu\n"
        f"`/cuongbao @user` — Hỏa lực luồng kép\n"
        f"`/tamxa @user` — Tấn công qua DM\n"
        f"`/phatngon <nội dung>` — Xả chữ liên tục\n"
        f"`/diemdanh` — Bão đếm số\n"
        f"`/baobi` — Mưa icon đặc biệt\n"
        f"`/satngon @user` — Xả kho ý tưởng\n"
        f"`/dinhchi` — Ngắt lệnh ngay lập tức\n"
        f"`/tocdo <giây>` — Cài đặt độ trễ (khuyên dùng >= 0.5s)\n\n"
        f"**🔑 BẢN QUYỀN:**\n"
        f"`/nhapma <MÃ>` — Nhập mã kích hoạt\n"
        f"`/keymode on/off` — Bật/Tắt chế độ bắt buộc mã (Admin)"
    )
    await m.reply(base)

# ==================== ENTRYPOINT MAIN ====================
async def main():
    # 1. Bật web server để Render kiểm tra cổng (Health Check)
    await start_render_web_server()
    
    # 2. Khởi động Pyrogram Client
    await app.start()
    print("[*] Telegram Bot đã khởi chạy và kết nối thành công!")
    
    try:
        await app.set_bot_commands([
            BotCommand("lenh", "Xem danh sách lệnh"),
            BotCommand("tancoc", "Bão hỏa lực nhóm"),
            BotCommand("cuongbao", "Hỏa lực luồng kép"),
            BotCommand("tamxa", "Tấn công riêng"),
            BotCommand("phatngon", "Xả văn bản chỉ định"),
            BotCommand("diemdanh", "Bão số đếm"),
            BotCommand("baobi", "Mưa icon"),
            BotCommand("satngon", "Xả kho ý tưởng"),
            BotCommand("dinhchi", "Dừng ngay lập tức"),
            BotCommand("tocdo", "Cài tốc độ gửi tin"),
        ])
    except Exception as e:
        print(f"[!] Warning set_bot_commands: {e}")

    # Giữ tiến trình chạy cho tới khi dừng chương trình
    await idle()
    await app.stop()

if __name__ == "__main__":
    asyncio.run(main())
