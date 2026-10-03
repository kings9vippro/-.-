import asyncio
import io
import json
import os
import random
import re
import string
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from aiohttp import web
from pyrogram import Client, filters
from pyrogram.errors import (
    BadRequest,
    ChatAdminRequired,
    FloodWait,
    PeerIdInvalid,
    RPCError,
    UserIsBlocked,
)
from pyrogram.types import (
    BotCommand,
    CallbackQuery,
    ChatPermissions,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
)

if sys.platform != "win32":
    try:
        import uvloop
        uvloop.install()
    except ImportError:
        pass

# ==================== THIẾT LẬP THAM SỐ HỆ THỐNG ====================
API_ID = int(os.environ.get("API_ID", 32906102))
API_HASH = os.environ.get("API_HASH", "9fc3add5b6bf34cc5335a85388f34a0f")
BOT_TOKEN = os.environ.get("BOT_TOKEN", "8251965879:AAFHl0iLezOJrjQLxWQHeMc1RoK8ul7-K7g")

SUPER_ADMINS = [6094686933]
BOT_NAME = "亗 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 𝕯𝕺̣̂𝕮 𝕹𝕳𝕬̂́𝕿 𝖁𝕺̂ 𝕹𝖁𝕴 亗"
FREE_BOT = "@AnhKhoiWar_Bot"

MUST_JOIN = []
BANNED_CHATS = []
PROTECTED = ["anhkhoi", "anh_khoi", "pham_anh_khoi", "dev_anh_khoi", "6094686933"]

DB_FILE = "anhkhoi_db.json"
CORPUS_FILE = "anhkhoi_corpus.json"

# ==================== KHO NGÔN CƠ BẢN (KHỞI TẠO NẾU RỖNG) ====================
DEFAULT_CORPUS = [
    "Khaos Titan tối cao nghiền nát mọi chướng ngại cản đường",
    "Sức mạnh vô đối của Anh Khôi áp đảo toàn bộ chiến trường",
    "Đẳng cấp chênh lệch quá xa, đừng cố gắng trong vô vọng",
    "Hỏa lực tối đa kích hoạt, quét sạch mọi đối thủ",
    "Tuyệt đối phục tùng trước uy quyền tối thượng",
    "Không một ai đủ tư cách đứng ngang hàng ở đây",
    "Chiến trường này là sàn diễn độc quyền của Anh Khôi",
    "Hủy diệt toàn diện, không lưu lại một dấu vết",
]

# ==================== QUẢN LÝ DỮ LIỆU BẢN QUYỀN & NGÔN TỪ ====================
def init_db_structure():
    return {
        "server_key": True,
        "users": {},
        "keys": {},
        "tasks": {},
        "banned": [],
        "auth": [],
        "admins": [],
        "delay": 0.0001,
        "groups": {},
        "spam_active": {},
    }

def load_db():
    if Path(DB_FILE).exists():
        try:
            raw = json.loads(Path(DB_FILE).read_text(encoding="utf-8"))
            base = init_db_structure()
            base.update(raw)
            base["users"] = {int(k): v for k, v in base["users"].items()}
            base["banned"] = [int(x) for x in base["banned"]]
            base["auth"] = [int(x) for x in base["auth"]]
            base["admins"] = [int(x) for x in base["admins"]]
            return base
        except Exception:
            pass
    return init_db_structure()

def save_db():
    out = dict(db)
    out["users"] = {str(k): v for k, v in db["users"].items()}
    Path(DB_FILE).write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")

db = load_db()

def load_corpus():
    data = set(DEFAULT_CORPUS)
    if Path(CORPUS_FILE).exists():
        try:
            loaded = json.loads(Path(CORPUS_FILE).read_text(encoding="utf-8"))
            if isinstance(loaded, list):
                for item in loaded:
                    cleaned = item.strip()
                    if cleaned:
                        data.add(cleaned)
        except Exception:
            pass
    else:
        save_corpus_list(list(data))
    return list(data)

def save_corpus_list(items):
    clean_unique = sorted(list({x.strip() for x in items if x.strip()}))
    Path(CORPUS_FILE).write_text(json.dumps(clean_unique, ensure_ascii=False, indent=2), encoding="utf-8")

memory_corpus = load_corpus()

def all_adm():
    return list(set(SUPER_ADMINS + [x for x in db.get("admins", [])]))

def is_adm(uid):
    return uid in SUPER_ADMINS or uid in db.get("admins", [])

# ==================== RENDER WEB SERVER PORT BINDING ====================
async def web_health(request):
    return web.Response(
        text=f"{BOT_NAME}\nSTATUS: RUNNING 24/7 ON RENDER\nCORPUS ITEMS: {len(memory_corpus)}\nAUTHOR: ANH KHOI",
        status=200,
        content_type="text/plain; charset=utf-8",
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
    print(f"[*] Render Web Server bound to port: {port}")

# ==================== TEXT GENERATOR & CYBER ASSETS ====================
SUOC_MODERN = [
    "亗 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 𝕯𝕺̣̂𝕮 𝕹𝕳𝕬̂́𝕿 𝖁𝕺̂ 𝕹𝖁𝕴 亗",
    "𓆩✧𓆪 𖤍 𝗖𝗬𝗕𝗘𝗥 𝗪𝗔𝗥𝗟𝗢𝗥𝗗 𝗔𝗡𝗛 𝗞𝗛𝗢̂𝗜 𖤍 𓆩✧𓆪",
    "𒆜 ☬ 𝕯𝕰𝕬𝕿𝕳 𝕽𝕰𝕬𝕷𝕸 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 ☬ 𒆜",
    "🜲 𝕭𝕷𝕬𝕮𝕶 𝕰𝕸𝖄𝕴𝕽𝕰 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 🜲",
    "𒀱 𝕴𝕹𝕱𝕰𝕽𝕹𝕺 𝕯𝕺𝕸𝕴𝕹𝕬𝕿𝕴𝕺𝕹 𒀱",
]

ICONS_MODERN = [
    "亗 𖤍 🜲", "𓆩✧𓆪 ☬ 𒆜", "𒀱 ⚡ 𖣘",
    "✦ ᯓ ⚜", "𓊈☠︎𓊉 ☣ 𖤐", "𖤍 𓊈AK𓊉 亗"
]

def lol(n=None):
    if n is None:
        n = random.randint(3, 12)
    return "=" + (")" * n)

def get_payload_insult():
    global memory_corpus
    if not memory_corpus:
        return f"Sức mạnh vô địch của Anh Khôi {lol()}"
    return f"{random.choice(memory_corpus)} {lol()}"

def build_war_banner(mention=""):
    art = random.choice(SUOC_MODERN)
    m = f"{mention}\n" if mention else ""
    return f"{art}\n\n{m}⚡ 亗 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 𝕯𝕺̣̂𝕮 𝕹𝕳𝕬̂́𝕿 𝖁𝕺̂ 𝕹𝖁𝕴 亗 ⚡"

def build_insult_delivery(mention=""):
    ins = get_payload_insult()
    m = f"{mention} " if mention else ""
    return f"𖤍 {m}{ins}"

# ==================== KHỞI TẠO CLIENT TELEGRAM ====================
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
    if uid in db.get("banned", []):
        return "banned"
    if is_adm(uid):
        return "ok"
    cid = str(msg.chat.id)
    if cid in db.get("banned_chats", []):
        return "pc"
    if getattr(msg.chat, "username", "") in BANNED_CHATS:
        return "pc"
    if uid in db.get("auth", []):
        return "ok"
    for g in MUST_JOIN:
        try:
            await app.get_chat_member(g, uid)
        except Exception:
            return "join"
    if db.get("server_key", True):
        exp = db.get("users", {}).get(uid)
        if not exp:
            return "key"
        try:
            if datetime.fromisoformat(str(exp)) < datetime.now():
                return "key"
        except Exception:
            return "key"
    return "ok"

async def deny(msg: Message, r: str):
    if r == "join":
        gs = "\n".join(f"• t.me/{g}" for g in MUST_JOIN)
        await msg.reply(f"❌ Cần tham gia kênh chỉ định:\n{gs}\n\n👑 Bot: {FREE_BOT}")
    elif r == "key":
        await msg.reply(f"🔑 Cần Mã Kích Hoạt! Cú pháp: `/nhapma <MÃ>`\n👑 Bot: {FREE_BOT}")
    elif r == "banned":
        await msg.reply("🚫 Bạn đã bị chặn quyền truy cập hệ thống!")

async def resolve(msg: Message):
    tgt = None
    mention = None
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
                except ValueError:
                    pass
    for n in PROTECTED:
        if n in str(mention).lower() or n in str(tgt).lower():
            return None, None
    return tgt, mention

def speed_kb():
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("⚡ Turbo (0.0001s)", callback_data="akspd_0.0001"),
            InlineKeyboardButton("⚡ Nhanh (0.1s)", callback_data="akspd_0.1"),
        ],
        [
            InlineKeyboardButton("✦ Vừa (0.5s)", callback_data="akspd_0.5"),
            InlineKeyboardButton("🐢 Chuẩn (1s)", callback_data="akspd_1.0"),
        ]
    ])

# ==================== ENGINE PHUN LỆNH SONG SONG ====================
async def turbo_worker(chat_id, target, mention, mode, content, tid, stats):
    delay = max(float(db.get("delay", 0.0001)), 0.00001)
    while db.get("tasks", {}).get(tid):
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
            await asyncio.sleep(delay if delay > 0.001 else 0.0001)
        except FloodWait as e:
            w = max(e.value, 3)
            try:
                await app.send_message(chat_id, f"⏳ Rate-limit {w}s | Tổng đã xuất: {stats['count']} đòn")
            except Exception:
                pass
            await asyncio.sleep(w)
        except UserIsBlocked:
            db["tasks"][tid] = False
            db["spam_active"][tid] = False
            save_db()
            break
        except (PeerIdInvalid, BadRequest):
            stats["err"] += 1
            if stats["err"] >= 5:
                db["tasks"][tid] = False
                db["spam_active"][tid] = False
                save_db()
                break
            await asyncio.sleep(1)
        except RPCError:
            stats["err"] += 1
            await asyncio.sleep(1.5)

async def supreme_engine(chat_id, user_id, target, mention, mode="tancoc", content=None, workers_count=1):
    tid = f"{chat_id}_{user_id}"
    db["tasks"][tid] = True
    db["spam_active"][tid] = True
    save_db()

    stats = {"count": 0, "err": 0}
    delay = db.get("delay", 0.0001)

    try:
        await app.send_message(
            chat_id,
            f"🚀 **{BOT_NAME} – XUNG TRẬN!**\n"
            f"🎯 Mục tiêu: {mention or target}\n"
            f"⚡ Chế độ: {mode.upper()} | Trễ: {delay}s | Luồng: x{workers_count}\n"
            f"👑 Thống soái: Anh Khôi"
        )
    except Exception:
        pass

    tasks = [
        asyncio.create_task(turbo_worker(chat_id, target, mention, mode, content, tid, stats))
        for _ in range(workers_count)
    ]

    RUN_TIME = 300
    REST_TIME = 25

    while db.get("tasks", {}).get(tid):
        await asyncio.sleep(RUN_TIME)
        if not db.get("tasks", {}).get(tid):
            break
        try:
            await app.send_message(chat_id, f"💤 Tạm dừng nghỉ {REST_TIME}s giảm tải | Đã xuất: **{stats['count']}** đòn.")
        except Exception:
            pass
        await asyncio.sleep(REST_TIME)

    db["tasks"][tid] = False
    db["spam_active"][tid] = False
    save_db()

    for t in tasks:
        if not t.done():
            t.cancel()

    try:
        await app.send_message(chat_id, f"🏁 **KẾT THÚC ĐỢT XẢ** | Tổng lực hoàn thành: **{stats['count']}** đòn!")
    except Exception:
        pass

# ==================== LỆNH TẤN CÔNG & ĐIỀU KHIỂN ====================
@app.on_message(filters.command("tancoc"))
async def cmd_tancoc(_, m: Message):
    if (r := await chk(m)) != "ok":
        return await deny(m, r)
    t, mn = await resolve(m)
    if not t:
        return await m.reply("❌ Cú pháp: `/tancoc @user` hoặc reply tin nhắn")
    asyncio.create_task(supreme_engine(m.chat.id, m.from_user.id, t, mn, "tancoc", workers_count=1))

@app.on_message(filters.command("cuongbao"))
async def cmd_cuongbao(_, m: Message):
    if (r := await chk(m)) != "ok":
        return await deny(m, r)
    t, mn = await resolve(m)
    if not t:
        return await m.reply("❌ Cú pháp: `/cuongbao @user` (Turbo x3 luồng)")
    asyncio.create_task(supreme_engine(m.chat.id, m.from_user.id, t, mn, "tancoc", workers_count=3))

@app.on_message(filters.command("tamxa"))
async def cmd_tamxa(_, m: Message):
    if (r := await chk(m)) != "ok":
        return await deny(m, r)
    t, mn = await resolve(m)
    if not t:
        return await m.reply("❌ Cú pháp: `/tamxa @user` hoặc reply tin nhắn")
    asyncio.create_task(supreme_engine(m.chat.id, m.from_user.id, t, mn, "tamxa", workers_count=1))

@app.on_message(filters.command("phatngon"))
async def cmd_phatngon(_, m: Message):
    if (r := await chk(m)) != "ok":
        return await deny(m, r)
    p = m.text.split(None, 1)
    if len(p) < 2:
        return await m.reply("❌ Cú pháp: `/phatngon <nội dung>`")
    mn = m.reply_to_message.from_user.mention if (m.reply_to_message and m.reply_to_message.from_user) else ""
    asyncio.create_task(supreme_engine(m.chat.id, m.from_user.id, m.chat.id, mn, "phatngon", content=p[1]))

@app.on_message(filters.command("diemdanh"))
async def cmd_diemdanh(_, m: Message):
    if (r := await chk(m)) != "ok":
        return await deny(m, r)
    mn = m.reply_to_message.from_user.mention if (m.reply_to_message and m.reply_to_message.from_user) else ""
    asyncio.create_task(supreme_engine(m.chat.id, m.from_user.id, m.chat.id, mn, "diemdanh"))

@app.on_message(filters.command("baobi"))
async def cmd_baobi(_, m: Message):
    if (r := await chk(m)) != "ok":
        return await deny(m, r)
    mn = m.reply_to_message.from_user.mention if (m.reply_to_message and m.reply_to_message.from_user) else ""
    asyncio.create_task(supreme_engine(m.chat.id, m.from_user.id, m.chat.id, mn, "baobi"))

@app.on_message(filters.command("satngon"))
async def cmd_satngon(_, m: Message):
    if (r := await chk(m)) != "ok":
        return await deny(m, r)
    t, mn = await resolve(m)
    if not t:
        t = m.chat.id
        mn = ""
    asyncio.create_task(supreme_engine(m.chat.id, m.from_user.id, t, mn, "satngon", workers_count=2))

@app.on_message(filters.command("dinhchi"))
async def cmd_dinhchi(_, m: Message):
    tid = f"{m.chat.id}_{m.from_user.id}"
    if is_adm(m.from_user.id):
        stopped = sum(1 for k in list(db.get("tasks", {})) if str(m.chat.id) in k and db["tasks"].pop(k, False))
        db["spam_active"] = {k: v for k, v in db.get("spam_active", {}).items() if str(m.chat.id) not in k}
        save_db()
        return await m.reply(f"🛑 Đã dừng toàn bộ **{stopped}** chiến dịch trong nhóm!")
    if db.get("tasks", {}).get(tid):
        db["tasks"][tid] = False
        db["spam_active"][tid] = False
        save_db()
        await m.reply("🛑 Đã dừng chiến dịch cá nhân của bạn!")
    else:
        await m.reply("⚠️ Hiện không có tiến trình nào đang chạy.")

@app.on_message(filters.command("tocdo"))
async def cmd_tocdo(_, m: Message):
    if (r := await chk(m)) != "ok":
        return await deny(m, r)
    p = m.text.split()
    if len(p) == 1:
        return await m.reply(
            f"⚡ **TỐC ĐỘ XẢ:** `{db.get('delay', 0.0001)}s/đòn`\nChọn bên dưới hoặc cấu hình: `/tocdo 0.001`",
            reply_markup=speed_kb()
        )
    try:
        v = float(p[1].lower().rstrip("s"))
        v = max(v, 0.00001)
        db["delay"] = v
        save_db()
        await m.reply(f"✅ Đã cập nhật tốc độ thành: **{v}s/đòn**")
    except ValueError:
        await m.reply("❌ Định dạng số không hợp lệ!")

@app.on_callback_query(filters.regex(r"^akspd_"))
async def cb_speed_change(_, cq: CallbackQuery):
    try:
        v = float(cq.data.split("_")[1])
        db["delay"] = v
        save_db()
        await cq.answer(f"Đã lưu: {v}s")
        await cq.message.edit_text(f"✅ Đã thiết lập vận tốc: **{v}s/đòn**")
    except Exception as e:
        await cq.answer(f"Lỗi: {e}", show_alert=True)

# ==================== NÂNG CẤP: QUẢN LÝ KHO NGÔN TỪ & NẠP FILE TXT ====================
@app.on_message(filters.command("themngon"))
async def cmd_themngon(_, m: Message):
    if not is_adm(m.from_user.id):
        return await m.reply("❌ Chỉ Thống Soái mới có quyền nạp ngôn từ!")
    p = m.text.split(None, 1)
    if len(p) < 2:
        return await m.reply("💡 Cú pháp: `/themngon Câu 1 | Câu 2 | Câu 3`")
    
    global memory_corpus
    raw_entries = p[1].split("|")
    new_added = 0
    current_set = set(memory_corpus)

    for item in raw_entries:
        cleaned = re.sub(r"^\d+[\.\)]\s*", "", item).strip()
        if len(cleaned) >= 2 and cleaned not in current_set:
            current_set.add(cleaned)
            new_added += 1

    memory_corpus = sorted(list(current_set))
    save_corpus_list(memory_corpus)
    await m.reply(f"✅ **ĐÃ THÊM THÀNH CÔNG:**\n➕ Thêm mới: `{new_added}` câu\n📚 Tổng kho hiện tại: `{len(memory_corpus)}` câu")

@app.on_message(filters.command("napfile") | (filters.document & filters.caption))
async def cmd_napfile(_, m: Message):
    if not is_adm(m.from_user.id):
        return
    
    doc = m.document
    caption = m.caption or m.text or ""
    
    if not doc and m.reply_to_message and m.reply_to_message.document:
        doc = m.reply_to_message.document
    
    if not doc or not doc.file_name.lower().endswith(".txt"):
        if "/napfile" in caption:
            return await m.reply("💡 Vui lòng gửi đính kèm file `.txt` hoặc reply file `.txt` với lệnh `/napfile`")
        return

    if "/napfile" not in caption and not (m.text and m.text.startswith("/napfile")):
        return

    status = await m.reply("⏳ Đang tải file và tiến hành khử trùng lặp (Deduplication)...")
    global memory_corpus
    
    try:
        download_path = await app.download_media(doc)
        content = Path(download_path).read_text(encoding="utf-8", errors="ignore")
        Path(download_path).unlink(missing_ok=True)
        
        lines = content.splitlines()
        current_set = set(memory_corpus)
        initial_count = len(current_set)
        
        for line in lines:
            cleaned = re.sub(r"^\d+[\.\)]\s*", "", line).strip()
            if len(cleaned) >= 2:
                current_set.add(cleaned)
        
        new_count = len(current_set)
        added = new_count - initial_count
        
        memory_corpus = sorted(list(current_set))
        save_corpus_list(memory_corpus)
        
        await status.edit_text(
            f"✅ **XỬ LÝ FILE TXT HOÀN TẤT!**\n"
            f"📄 Tệp: `{doc.file_name}`\n"
            f"📥 Đã quét: `{len(lines)}` dòng\n"
            f"✨ Thêm mới (không trùng): `{added}` câu\n"
            f"📊 Tổng kho từ vựng hiện tại: `{len(memory_corpus)}` câu"
        )
    except Exception as e:
        await status.edit_text(f"❌ Xảy ra lỗi xử lý file: `{e}`")

@app.on_message(filters.command("kho"))
async def cmd_kho(_, m: Message):
    if (r := await chk(m)) != "ok":
        return await deny(m, r)
    total = len(memory_corpus)
    sample = "\n".join(f"• {x}" for x in random.sample(memory_corpus, min(5, total)))
    await m.reply(
        f"📊 **KHO VŨ KHÍ TỪ VỰNG ANH KHÔI**\n"
        f"Tổng số câu khả dụng: `{total}`\n\n"
        f"🔍 **Trích mẫu ngẫu nhiên:**\n{sample}\n\n"
        f"💡 Thêm mới: `/themngon` hoặc gửi file .txt kèm `/napfile`"
    )

@app.on_message(filters.command("xoangon"))
async def cmd_xoangon(_, m: Message):
    if not is_adm(m.from_user.id):
        return await m.reply("❌ Chỉ Thống Soái mới có quyền xoá!")
    p = m.text.split(None, 1)
    if len(p) < 2:
        return await m.reply("💡 Cú pháp: `/xoangon <từ_khóa>` để xóa câu chứa từ khóa")
    keyword = p[1].strip().lower()
    global memory_corpus
    before = len(memory_corpus)
    memory_corpus = [x for x in memory_corpus if keyword not in x.lower()]
    deleted = before - len(memory_corpus)
    save_corpus_list(memory_corpus)
    await m.reply(f"🗑️️ Đã xóa `{deleted}` câu chứa từ khóa `{keyword}`. Còn lại: `{len(memory_corpus)}` câu.")

# ==================== QUẢN TRỊ NHÓM VÀ BẢN QUYỀN ====================
@app.on_message(filters.command(["dondep", "quetgon"]))
async def cmd_dondep(_, m: Message):
    if (r := await chk(m)) != "ok":
        return await deny(m, r)
    p = m.text.split()
    count = 20
    tuid = None
    for x in p[1:]:
        if x.startswith("@"):
            try:
                u = await app.get_users(x.lstrip("@"))
                tuid = u.id
            except Exception:
                pass
        else:
            try:
                count = int(x)
            except ValueError:
                pass
    count = min(count, 300)
    deleted = 0
    ids = []
    try:
        async for msg in app.get_chat_history(m.chat.id, limit=count + 30):
            if deleted >= count:
                break
            if tuid and msg.from_user and msg.from_user.id != tuid:
                continue
            ids.append(msg.id)
            deleted += 1
        for i in range(0, len(ids), 100):
            batch = ids[i:i + 100]
            try:
                await app.delete_messages(m.chat.id, batch)
            except Exception:
                for mid in batch:
                    try:
                        await app.delete_messages(m.chat.id, [mid])
                        await asyncio.sleep(0.01)
                    except Exception:
                        pass
    except Exception as e:
        return await m.reply(f"❌ {e}")
    try:
        n = await m.reply(f"🧹 Đã dọn dẹp `{deleted}` tin nhắn!")
        await asyncio.sleep(2)
        await n.delete()
    except Exception:
        pass

@app.on_message(filters.command("camkhau"))
async def cmd_camkhau(_, m: Message):
    if (r := await chk(m)) != "ok":
        return await deny(m, r)
    t, _ = await resolve(m)
    if not t or t in all_adm():
        return await m.reply("❌ Cú pháp: `/camkhau @user [phút]`")
    p = m.text.split()
    mins = int(p[2]) if len(p) > 2 and p[2].isdigit() else 0
    until = datetime.now(timezone.utc) + timedelta(minutes=mins) if mins else None
    try:
        await app.restrict_chat_member(m.chat.id, t, ChatPermissions(can_send_messages=False), until_date=until)
        await m.reply(f"🔇 Đã cấm khẩu mục tiêu ({'vĩnh viễn' if not mins else f'{mins} phút'})!")
    except ChatAdminRequired:
        await m.reply("❌ Bot cần quyền Admin để thao tác!")
    except Exception as e:
        await m.reply(f"❌ Lỗi: {e}")

@app.on_message(filters.command("khaitro"))
async def cmd_khaitro(_, m: Message):
    if (r := await chk(m)) != "ok":
        return await deny(m, r)
    t, _ = await resolve(m)
    if not t:
        return await m.reply("❌ Cú pháp: `/khaitro @user`")
    try:
        await app.restrict_chat_member(
            m.chat.id,
            t,
            ChatPermissions(
                can_send_messages=True,
                can_send_media_messages=True,
                can_send_other_messages=True,
                can_add_web_page_previews=True,
            ),
        )
        await m.reply("🔊 Đã mở khóa mõm!")
    except Exception as e:
        await m.reply(f"❌ Lỗi: {e}")

@app.on_message(filters.command("capma"))
async def cmd_capma(_, m: Message):
    if not is_adm(m.from_user.id):
        return
    try:
        p = m.text.split()
        days = int(p[1])
        devs = int(p[2])
        note = " ".join(p[3:]) if len(p) > 3 else ""
        k = gen_key()
        db["keys"][k] = {
            "days": days,
            "devs": devs,
            "users": [],
            "note": note,
            "created": datetime.now().isoformat(),
            "by": m.from_user.id,
        }
        save_db()
        await m.reply(f"🔑 **MÃ ĐÃ TẠO BỞI ANH KHÔI!**\n`{k}`\n📅 {days} ngày | 💻 {devs} máy")
    except Exception:
        await m.reply("💡 Cú pháp: `/capma <ngày> <số_máy> [ghi chú]`")

@app.on_message(filters.command("nhapma"))
async def cmd_nhapma(_, m: Message):
    p = m.text.split()
    uid = m.from_user.id
    if len(p) < 2:
        return await m.reply("💡 Cú pháp: `/nhapma <KEY>`")
    k = p[1]
    if k not in db.get("keys", {}):
        return await m.reply("❌ Mã kích hoạt không tồn tại!")
    kd = db["keys"][k]
    if uid in kd["users"]:
        return await m.reply("ℹ️ Bạn đã kích hoạt mã này trước đó!")
    if len(kd["users"]) >= kd["devs"]:
        return await m.reply("❌ Mã đã hết lượt sử dụng!")
    exp = datetime.now() + timedelta(days=kd["days"])
    db["users"][uid] = exp.isoformat()
    kd["users"].append(uid)
    save_db()
    await m.reply(f"✅ **KÍCH HOẠT THÀNH CÔNG!**\n📅 Thời hạn đến: {exp.strftime('%d/%m/%Y %H:%M')}")

@app.on_message(filters.command("kiemtrama"))
async def cmd_kiemtrama(_, m: Message):
    uid = m.from_user.id
    if is_adm(uid):
        return await m.reply("👑 Anh Khôi Tối Cao – Quyền năng vĩnh cửu!")
    exp = db.get("users", {}).get(uid)
    if not exp:
        return await m.reply("❌ Bạn chưa kích hoạt mã bản quyền!")
    try:
        dt = datetime.fromisoformat(str(exp))
        rem = dt - datetime.now()
        if rem.total_seconds() < 0:
            return await m.reply("⏰ Mã kích hoạt của bạn đã hết hạn!")
        await m.reply(f"✅ **BẢN QUYỀN HỢP LỆ**\n📅 Hạn dùng: {dt.strftime('%d/%m/%Y %H:%M')}\n⏳ Còn: {rem.days} ngày {rem.seconds // 3600} giờ")
    except Exception:
        await m.reply("❌ Lỗi dữ liệu bản quyền!")

@app.on_message(filters.command(["lenh", "help", "start"]))
async def cmd_help(_, m: Message):
    uid = m.from_user.id if m.from_user else 0
    msg_body = (
        f"⚡ **{BOT_NAME}** ⚡\n"
        f"👑 Tác giả độc quyền: **Anh Khôi**\n"
        f"🌐 Hệ thống: **Render 24/7 Engine**\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n\n"
        f"**⚔️️ HỎA LỰC TẤN CÔNG:**\n"
        f"`/tancoc @user` — Bão hỏa lực nhóm\n"
        f"`/cuongbao @user` — Cuồng bạo x3 luồng cực hạn\n"
        f"`/tamxa @user` — Xả tin nhắn riêng (DM)\n"
        f"`/phatngon <text>` — Bắn văn bản tự chọn\n"
        f"`/diemdanh` — Bão số thứ tự\n"
        f"`/baobi` — Mưa ký tự Cyber/Gothic\n"
        f"`/satngon @user` — Xả ngôn từ sát thương cao\n"
        f"`/dinhchi` — Ngắt mọi tiến trình\n"
        f"`/tocdo` — Tinh chỉnh trễ mili-giây\n\n"
        f"**📚 QUẢN LÝ KHO NGÔN TỪ:**\n"
        f"`/kho` — Thống kê và xem mẫu câu trong kho\n"
        f"`/themngon <câu 1 | câu 2>` — Thêm trực tiếp\n"
        f"`/napfile` — Gửi đính kèm file `.txt` để nạp kho\n"
        f"`/xoangon <từ khóa>` — Lọc xoá từ kho\n\n"
        f"**🏠 QUẢN TRỊ & BẢN QUYỀN:**\n"
        f"`/dondep <số>` — Thanh lọc tin nhắn\n"
        f"`/camkhau @user` — Khóa mõm\n"
        f"`/khaitro @user` — Mở khóa\n"
        f"`/nhapma <MÃ>` — Kích hoạt quyền sử dụng\n"
        f"`/kiemtrama` — Kiểm tra hạn bản quyền"
    )
    if is_adm(uid):
        msg_body += "\n\n**👑 QUẢN TRỊ:** `/capma` | Quản lý độc quyền Thống Soái"
    await m.reply(msg_body)

# ==================== ENTRYPOINT MAIN ====================
async def main():
    await start_render_web_server()
    await app.start()
    print("[*] Telegram Bot Anh Khôi đã sẵn sàng thực thi trên Render!")

    try:
        await app.set_bot_commands([
            BotCommand("lenh", "Danh sách chức năng"),
            BotCommand("tancoc", "Bão hỏa lực nhóm"),
            BotCommand("cuongbao", "Cuồng bạo x3 luồng"),
            BotCommand("tamxa", "Bắn phá tin nhắn riêng"),
            BotCommand("phatngon", "Xả văn bản chỉ định"),
            BotCommand("diemdanh", "Bão số đếm"),
            BotCommand("baobi", "Mưa icon Cyber/Gothic"),
            BotCommand("satngon", "Xả kho ngôn từ"),
            BotCommand("kho", "Xem thống kê kho ngôn"),
            BotCommand("dinhchi", "Dừng tiến trình tấn công"),
            BotCommand("tocdo", "Cài đặt vận tốc"),
            BotCommand("dondep", "Dọn dẹp tin nhắn"),
            BotCommand("nhapma", "Nhập mã kích hoạt"),
            BotCommand("kiemtrama", "Kiểm tra hạn dùng"),
        ])
    except Exception:
        pass

    await asyncio.Event().wait()

if __name__ == "__main__":
    app.run(main())
