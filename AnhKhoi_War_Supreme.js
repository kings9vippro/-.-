import asyncio, random, string, json, re, time, sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from pyrogram import Client, filters
from pyrogram.types import (
    BotCommand, ChatPermissions, Message,
    InlineKeyboardMarkup, InlineKeyboardButton, CallbackQuery
)
from pyrogram.errors import (
    FloodWait, UserIsBlocked, RPCError,
    PeerIdInvalid, ChatAdminRequired, BadRequest
)

# Kích hoạt uvloop để tối ưu hóa event loop đạt xung nhịp cực đại trên Linux
if sys.platform != "win32":
    try:
        import uvloop
        uvloop.install()
    except ImportError:
        pass

# ==================== CẤU HÌNH HỆ THỐNG ANH KHÔI ====================
API_ID       = 32906102         # Điền API_ID từ my.telegram.org của bạn
API_HASH     = "9fc3add5b6bf34cc5335a85388f34a0f"        # Điền API_HASH từ my.telegram.org của bạn
BOT_TOKEN    = "8251965879:AAFHl0iLezOJrjQLxWQHeMc1RoK8ul7-K7g"

SUPER_ADMINS = [6094686933]
BOT_NAME     = "亗 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 𝕯𝕺̣̂𝕮 𝕹𝕳𝕬̂́𝕿 𝖁𝕺̂ 𝕹𝖁𝕴 亗"
FREE_BOT     = "@AnhKhoiWar_Bot"

MUST_JOIN    = []
BANNED_CHATS = []
BC_GROUPS    = []
PROTECTED    = ["anhkhoi", "anh_khoi", "pham_anh_khoi", "dev_anh_khoi", "6094686933"]
SHARE_GROUPS = []
REF_THRESHOLD= 10
REF_FREE_HOURS = 12

DB_FILE      = "anhkhoi_db.json"
INSF_FILE    = "anhkhoi_insults.json"
EXTERNAL_TXT = "100.000 ngôn idea hqh.txt"

# ==================== CƠ SỞ DỮ LIỆU BẢN QUYỀN ====================
def _ddb():
    return dict(server_key=True, users={}, keys={}, tasks={},
                banned=[], auth=[], admins=[], delay=0.0001,
                groups={}, refs={}, ref_claimed={}, spam_active={})

def ldb():
    if Path(DB_FILE).exists():
        try:
            d = json.loads(Path(DB_FILE).read_text("utf-8"))
            b = _ddb(); b.update(d)
            b["users"]       = {int(k): v for k, v in b["users"].items()}
            b["banned"]      = [int(x) for x in b["banned"]]
            b["auth"]        = [int(x) for x in b["auth"]]
            b["admins"]      = [int(x) for x in b["admins"]]
            b["refs"]        = {int(k): v for k, v in b["refs"].items()}
            b["ref_claimed"] = {int(k): v for k, v in b["ref_claimed"].items()}
            return b
        except: pass
    return _ddb()

def sdb():
    out = dict(db)
    out["users"]       = {str(k): v for k, v in db["users"].items()}
    out["refs"]        = {str(k): v for k, v in db["refs"].items()}
    out["ref_claimed"] = {str(k): v for k, v in db["ref_claimed"].items()}
    Path(DB_FILE).write_text(json.dumps(out, ensure_ascii=False, default=str), "utf-8")

db = ldb()
def all_adm(): return SUPER_ADMINS + [x for x in db["admins"] if x not in SUPER_ADMINS]
def is_adm(u): return u in SUPER_ADMINS or u in db["admins"]

# ==================== BIỂU TƯỢNG HIỆN ĐẠI (CYBER / GOTHIC / DARK LUXURY) ====================
SUOC_MODERN = [
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
]

ICONS_MODERN = [
    "亗 𖤍 🜲", "𓆩✧𓆪 ☬ 𒆜", "𒀱 ⚡ 𖣘",
    "✦ ᯓ ⚜", "𓊈☠︎𓊉 ☣ 𖤐", "𝕬 𝕶 𝕳",
    "❖ ⚡ ☬", "𖤍 𓊈AK𓊉 亗", "🜲 ✦ 𒀱"
]

def lol(n=None):
    if n is None: n = random.randint(3, 16)
    return "=" + ")" * n

# ==================== KHO TOÀN BỘ NGÔN TỪ 100.000 IDEA ====================
RAW_IDEAS_SOURCE = [
    "Dit me may, song nhu cai lon rach ma cung du war",
    "Cai mat may nhin nhu lo dit bi dam sung",
    "To tien may ma biet de ra thu nhu may chac tu khai tu dong ho",
    "Cac bo may ma co mieng, no cung tu choi de ra may",
    "May chui tao a? Nhu cho sua vao tuong xi mang vay con a",
    "Tao ma la may thi tao dap dau vao bon cau ma chet cho do nhuc",
    "Thang oc cho nhu may di thi IQ chac bi duoi vi xuc pham chi so toi thieu",
    "Bo may noi cau nao la may cam cau do, vi may la can ba xa hoi",
    "Nao may nhu qua trung thoi chua no da len men",
    "May ma len tieng la o nhiem am thanh toan khu vuc",
    "Tao tha nuoi con cho con hon nhin thay mat may them mot giay",
    "Cai giong nhu may nen dem chon song de khoi lay lan cai ngu",
    "Chui may nhu chui vao ho xi – chang ai ngui noi",
    "Noi chuyen voi may tao thay IQ tut khong phanh",
    "May la loi gen tram trong nhat trong lich su tao hoa",
    "Cai lon me may chac chan co van de nen moi de ra may",
    "May ma thong minh thi con ruoi la ky su cong nghe",
    "Doi may sinh ra de lam vi du cho su nhuc nha",
    "Tao war voi may nhu va vao mat dong cut – cha suong ti nao, chi hoi",
    "May la san pham loi ma bo me may quen xoa",
    "Chui may ma may con cuoi duoc la tao ne cai mat tro li cua may day",
    "Cai mat may nhu cai mam com bi i vao giua",
    "Cho nha tao sua con co ly hon may noi",
    "May song duoc den gio la phep mau cua y hoc",
    "May nhu cai quan lot rach – ai cung muon vut",
    "Lam nguoi khong xong con du war – may bi dan a?",
    "May ma la doi thu tao thi tao win tu luc chua mo mom",
    "Hit tho thoi may cung lam o nhiem khong khi roi",
    "May nhu cai bao tai phan roi giua cho doi",
    "Nao may khong hoat dong, chi dung de chong rung dau thoi a?",
    "Tao chui may den to tien may cung phai cui dau",
    "May nen di kham, nao may dang co van de nghiem trong",
    "Nguoi ta bao dung chui ngu, ma may ep tao qua",
    "Cut ve bao me de may lai di, loi roi",
    "Noi that, tao chua tung thay ai ngu nhu may",
    "Cai the loai nhu may ma cung len tieng?",
    "May la vet nho tren cai quan lot cua nhan loai",
    "Tao dap ban phim con thong minh hon may go phim",
    "Chui may khong phi cong, ma phi ca cam xuc",
    "Tao ia ra con co gia tri hon cai su ton tai cua may",
    "May la ly do nguoi ta mat niem tin vao giao duc",
    "Thang dau dat nhu may nen bi niem phong nao lai",
    "Su xuat hien cua may nhu virut cho xa hoi",
    "Chui may chan roi, muon tat luon su song may cho le",
    "May ma co ich thi tao la than thanh roi",
    "The loai nhu may, tao va bang chan cung qua sang",
    "May nen cam on doi vi chua ai dap may toi chet",
    "Song nhu may la xuc pham khai niem nguoi",
    "Tao ma nhu may thi tao tu thieu tu lop mau giao",
    "May chui tao a? Nghe nhu tieng heo len con dong duc",
    "Anh Khôi đang online và mày vẫn thất bại toàn diện như thường",
    "Quỳ xuống trước mặt Anh Khôi Độc Nhất Vô Nhị đi con phế vật",
    "Đẳng cấp của Anh Khôi là thứ cả đời mày không bao giờ chạm tới được",
    "Một đòn thanh tẩy của Anh Khôi đủ xóa sổ cả gia phả nhà mày"
]

def load_all_ideas():
    unique = list(dict.fromkeys(RAW_IDEAS_SOURCE))
    for pth in [EXTERNAL_TXT, "100.000 ngôn idea hqh.txt", "idea.txt"]:
        p = Path(pth)
        if p.exists():
            try:
                for line in p.read_text("utf-8", errors="ignore").splitlines():
                    cleaned = re.sub(r"^\d+[\.\)]\s*", "", line).strip()
                    if len(cleaned) > 4 and cleaned not in unique:
                        unique.append(cleaned)
            except: pass
    return unique

IDEAS_CORPUS = load_all_ideas()
WAR_INSULTS = [f"{sentence} {lol()}" for sentence in IDEAS_CORPUS]

def load_learned_insults():
    if Path(INSF_FILE).exists():
        try: return json.loads(Path(INSF_FILE).read_text("utf-8"))
        except: pass
    return []

def save_learned_insults(lst):
    Path(INSF_FILE).write_text(json.dumps(lst, ensure_ascii=False), "utf-8")

_learned_ins = load_learned_insults()

def get_war_insult():
    pool = WAR_INSULTS + _learned_ins
    return random.choice(pool)

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

def gen_key(): return "AK-VIP-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=12))
def track_grp(cid, t): db["groups"][str(cid)] = {"title": t, "last": datetime.now().isoformat()}

async def chk(msg: Message):
    uid = msg.from_user.id if msg.from_user else 0
    if uid in db["banned"]: return "banned"
    if is_adm(uid): return "ok"
    cid = str(msg.chat.id)
    if cid in db.get("banned_chats", []): return "pc"
    if getattr(msg.chat, "username", "") in BANNED_CHATS: return "pc"
    if uid in db["auth"]: return "ok"
    for g in MUST_JOIN:
        try: await app.get_chat_member(g, uid)
        except: return "join"
    if db["server_key"]:
        exp = db["users"].get(uid)
        if not exp: return "key"
        try:
            if datetime.fromisoformat(str(exp)) < datetime.now(): return "key"
        except: return "key"
    return "ok"

async def deny(msg, r):
    if r == "join":
        gs = "\n".join(f"• t.me/{g}" for g in MUST_JOIN)
        await msg.reply(f"❌ Yêu cầu tham gia địa bàn:\n{gs}\n\n👑 Bot: {FREE_BOT}")
    elif r == "key": await msg.reply(f"🔑 Cần Mã Kích Hoạt Của Anh Khôi! Cú pháp: `/nhapma <MÃ>`\n👑 Bot: {FREE_BOT}")
    elif r == "banned": await msg.reply("🚫 Ngươi đã bị Anh Khôi phong sát toàn diện!")

async def get_tu(msg: Message):
    if msg.reply_to_message and msg.reply_to_message.from_user: return msg.reply_to_message.from_user
    p = msg.text.split()
    if len(p) > 1:
        try: return await app.get_users(p[1].lstrip("@"))
        except: pass
    return None

async def resolve(msg: Message):
    tgt = mention = None
    if msg.reply_to_message and msg.reply_to_message.from_user:
        u = msg.reply_to_message.from_user; tgt = u.id; mention = u.mention
    else:
        p = msg.text.split()
        if len(p) > 1:
            raw = p[1]; tgt = raw; mention = raw
            if not raw.startswith("@"):
                try: tgt = int(raw); mention = f"`{raw}`"
                except: pass
    for n in PROTECTED:
        if n in str(mention).lower() or n in str(tgt).lower(): return None, None
    return tgt, mention

def speed_kb():
    return InlineKeyboardMarkup([[
        InlineKeyboardButton("⚡⚡⚡ Turbo (0.0001s)", callback_data="akspd_0.0001"),
        InlineKeyboardButton("⚡ Nhanh (0.1s)",       callback_data="akspd_0.1"),
    ],[
        InlineKeyboardButton("✦ Trung (0.5s)",        callback_data="akspd_0.5"),
        InlineKeyboardButton("🐢 Chậm (1s)",           callback_data="akspd_1"),
    ]])

# ==================== PIPELINE HỎA LỰC TỐC ĐỘ CAO ====================
async def turbo_worker(chat_id, target, mention, mode, content, tid, stats):
    delay = max(float(db.get("delay", 0.0001)), 0.00001)
    while db["tasks"].get(tid):
        try:
            if   mode == "tancoc":   await app.send_message(chat_id, build_war_banner(mention))
            elif mode == "tamxa":    await app.send_message(target,  build_war_banner(mention))
            elif mode == "phatngon": await app.send_message(chat_id, f"{mention}\n{content}")
            elif mode == "diemdanh": await app.send_message(chat_id, f"⚡ **{BOT_NAME}** | {mention}\n`亗 Đòn #{stats['count']+1}`")
            elif mode == "baobi":    await app.send_message(chat_id, f"{random.choice(ICONS_MODERN)} {mention} {random.choice(ICONS_MODERN)}")
            elif mode == "satngon":  await app.send_message(chat_id, build_insult_delivery(mention))
            
            stats["count"] += 1
            stats["err"] = 0
            if delay > 0.001:
                await asyncio.sleep(delay)
            else:
                await asyncio.sleep(0.0001)
        except FloodWait as e:
            w = max(e.value, 3)
            try: await app.send_message(chat_id, f"⏳ FloodWait {w}s | Đã hạ gục {stats['count']} đòn")
            except: pass
            await asyncio.sleep(w)
        except UserIsBlocked:
            try:
                await app.send_message(chat_id, f"🚨 **MỤC TIÊU ĐÃ CHẶN BOT CỦA ANH KHÔI!**")
                for aid in all_adm():
                    try: await app.send_message(aid, f"🚨 TARGET BLOCKED: {mention or target} @ {chat_id}")
                    except: pass
            except: pass
            db["tasks"][tid] = False
            db["spam_active"][tid] = False
            sdb()
            break
        except (PeerIdInvalid, BadRequest):
            stats["err"] += 1
            if stats["err"] >= 6:
                db["tasks"][tid] = False
                db["spam_active"][tid] = False
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
    delay = db.get("delay", 0.0001)
    
    try:
        await app.send_message(
            chat_id,
            f"🚀 **{BOT_NAME} – XUNG TRẬN!**\n"
            f"🎯 Mục tiêu: {mention or target}\n"
            f"⚡ Chế độ: {mode.upper()} · Tốc độ: {delay}s | Luồng: x{workers_count}\n"
            f"👑 Thống soái: Anh Khôi"
        )
    except: pass

    # Khởi chạy đa luồng đồng thời
    tasks = [
        asyncio.create_task(turbo_worker(chat_id, target, mention, mode, content, tid, stats))
        for _ in range(workers_count)
    ]

    RUN_TIME = 5 * 60
    REST_TIME = 35
    
    while db["tasks"].get(tid):
        await asyncio.sleep(RUN_TIME)
        if not db["tasks"].get(tid): break
        try:
            await app.send_message(chat_id, f"💤 Anti-Ban nghỉ {REST_TIME}s hồi mana | Đã xả: **{stats['count']}** đòn\n🔄 Tự động tái kích hoạt!")
        except: pass
        await asyncio.sleep(REST_TIME)
        try:
            await app.send_message(chat_id, "🔥 ANH KHÔI TIẾP TỤC BÃO LỬA TRỪNG PHẠT!")
        except: pass

    db["tasks"][tid] = False
    db["spam_active"][tid] = False
    sdb()
    
    for t in tasks:
        if not t.done(): t.cancel()
        
    try:
        await app.send_message(chat_id, f"🏁 **KẾT THÚC CÀN QUÉT** | Tổng lực: **{stats['count']}** đòn kết liễu!")
    except: pass

# ==================== DANH SÁCH LỆNH TẤN CÔNG (MODERN COMMANDS) ====================

@app.on_message(filters.command("tancoc"))
async def cmd_tancoc(_, m):
    if (r := await chk(m)) != "ok": return await deny(m, r)
    t, mn = await resolve(m)
    if not t: return await m.reply("❌ Cú pháp: `/tancoc @user` hoặc reply tin nhắn")
    track_grp(m.chat.id, getattr(m.chat, "title", ""))
    asyncio.create_task(supreme_engine(m.chat.id, m.from_user.id, t, mn, "tancoc", workers_count=1))

@app.on_message(filters.command("cuongbao"))
async def cmd_cuongbao(_, m):
    if (r := await chk(m)) != "ok": return await deny(m, r)
    t, mn = await resolve(m)
    if not t: return await m.reply("❌ Cú pháp: `/cuongbao @user` (Chế độ Turbo x3 luồng cực hạn)")
    track_grp(m.chat.id, getattr(m.chat, "title", ""))
    asyncio.create_task(supreme_engine(m.chat.id, m.from_user.id, t, mn, "tancoc", workers_count=3))

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
    if len(p) < 2: return await m.reply("❌ Cú pháp: `/phatngon <văn bản>`")
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
    track_grp(m.chat.id, getattr(m.chat, "title", ""))
    asyncio.create_task(supreme_engine(m.chat.id, m.from_user.id, t, mn, "satngon", workers_count=2))

@app.on_message(filters.command("dinhchi"))
async def cmd_dinhchi(_, m):
    tid = f"{m.chat.id}_{m.from_user.id}"
    if is_adm(m.from_user.id):
        stopped = sum(1 for k in list(db["tasks"]) if str(m.chat.id) in k and db["tasks"].pop(k, False))
        db["spam_active"] = {k: v for k, v in db["spam_active"].items() if str(m.chat.id) not in k}
        sdb()
        return await m.reply(f"🛑 Anh Khôi đã đình chỉ toàn bộ **{stopped}** chiến dịch!")
    if db["tasks"].get(tid):
        db["tasks"][tid] = False
        db["spam_active"][tid] = False
        sdb()
        await m.reply("🛑 Đã dừng chiến dịch của bạn thành công!")
    else:
        await m.reply("⚠️ Không có chiến dịch nào đang chạy.")

@app.on_message(filters.command("tocdo"))
async def cmd_tocdo(_, m):
    if (r := await chk(m)) != "ok": return await deny(m, r)
    p = m.text.split()
    if len(p) == 1:
        return await m.reply(
            f"⚡ **TỐC ĐỘ HỎA LỰC ANH KHÔI**\nHiện tại: `{db.get('delay', 0.0001)}s/đòn`\n\n"
            "Chọn tốc độ hoặc thiết lập thủ công: `/tocdo 0.0001`",
            reply_markup=speed_kb())
    try:
        v = float(p[1].lower().rstrip("s"))
    except:
        return await m.reply("❌ Tốc độ không hợp lệ!")
    v = max(v, 0.00001)
    db["delay"] = v
    sdb()
    await m.reply(f"✅ Đã thiết lập vận tốc siêu cấp: **{v}s/đòn**")

@app.on_callback_query(filters.regex(r"^akspd_"))
async def cb_speed_ak(_, cq: CallbackQuery):
    v = float(cq.data.split("_")[1])
    db["delay"] = v
    sdb()
    label = {0.0001: "⚡⚡⚡ Turbo Cực Hạn", 0.1: "⚡ Siêu Tốc", 0.5: "✦ Vừa", 1: "🐢 Chậm"}.get(v, f"{v}s")
    await cq.answer(f"✅ {label}")
    await cq.message.edit_text(f"✅ Thiết lập: **{label} ({v}s/đòn)**")

@app.on_message(filters.command(["dondep", "quetgon"]))
async def cmd_dondep(_, m: Message):
    if (r := await chk(m)) != "ok": return await deny(m, r)
    p = m.text.split(); count = 20; tuid = None
    for x in p[1:]:
        if x.startswith("@"):
            try: u = await app.get_users(x.lstrip("@")); tuid = u.id
            except: pass
        else:
            try: count = int(x)
            except: pass
    count = min(count, 500); deleted = 0; ids = []
    try:
        async for msg in app.get_chat_history(m.chat.id, limit=count + 50):
            if deleted >= count: break
            if tuid and msg.from_user and msg.from_user.id != tuid: continue
            ids.append(msg.id); deleted += 1
        for i in range(0, len(ids), 100):
            batch = ids[i:i + 100]
            try: await app.delete_messages(m.chat.id, batch)
            except:
                for mid in batch:
                    try: await app.delete_messages(m.chat.id, [mid]); await asyncio.sleep(0.02)
                    except: pass
    except Exception as e: return await m.reply(f"❌ {e}")
    try:
        note = await m.reply(f"🧹 Anh Khôi đã thanh trừng sạch sẽ **{deleted}** tin nhắn!")
        await asyncio.sleep(2.5); await note.delete()
    except: pass

@app.on_message(filters.command("tracuu"))
async def cmd_tracuu(_, m: Message):
    if (r := await chk(m)) != "ok": return await deny(m, r)
    u = None
    if m.reply_to_message and m.reply_to_message.from_user: u = m.reply_to_message.from_user
    elif len(m.text.split()) > 1:
        try: u = await app.get_users(m.text.split()[1].lstrip("@"))
        except: return await m.reply("❌ Không tìm thấy đối tượng!")
    else: u = m.from_user
    await m.reply(
        f"📋 **HỒ SƠ ĐỐI TƯỢNG**\n━━━━━━━━━━━━━━━━\n"
        f"👤 Tên: {u.first_name} {u.last_name or ''}\n"
        f"🆔 ID: `{u.id}`\n📛 Username: @{u.username or 'N/A'}\n"
        f"🤖 Bot: {'Có' if u.is_bot else 'Không'} · ⭐ Premium: {'Có' if getattr(u, 'is_premium', False) else 'Không'}")

@app.on_message(filters.command("trieuhoi"))
async def cmd_trieuhoi(_, m):
    if (r := await chk(m)) != "ok": return await deny(m, r)
    mems = []
    async for mem in app.get_chat_members(m.chat.id):
        if not mem.user.is_bot and not mem.user.is_deleted: mems.append(mem.user.mention)
    for i in range(0, len(mems), 10):
        try: await m.reply(" ".join(mems[i:i + 10])); await asyncio.sleep(0.4)
        except FloodWait as e: await asyncio.sleep(e.value)

@app.on_message(filters.command("lanhtho"))
async def cmd_lanhtho(_, m):
    if not is_adm(m.from_user.id): return
    actives = [k for k, v in db.get("spam_active", {}).items() if v]
    gs = db.get("groups", {}); lines = []
    for cid, info in list(gs.items())[:20]:
        is_sp = any(cid in a for a in actives)
        lines.append(f"{'🔴' if is_sp else '🟢'} **{info['title']}** (`{cid}`)")
    await m.reply(
        f"📊 **LÃNH THỔ ANH KHÔI**\n━━━━━━━━━━━━━━━━\n"
        f"🔴 Đang thanh trừng: **{len(actives)}** | 📦 Tổng địa bàn: **{len(gs)}**\n\n" +
        ("\n".join(lines) or "Trống"))

@app.on_message(filters.command("camkhau"))
async def cmd_camkhau(_, m):
    if (r := await chk(m)) != "ok": return await deny(m, r)
    u = await get_tu(m)
    if not u: return await m.reply("💡 `/camkhau @user [phút]`")
    if u.id in all_adm(): return await m.reply("❌ Không thể cấm khẩu Admin!")
    p = m.text.split(); mins = 0
    if len(p) > 2:
        try: mins = int(p[2])
        except: pass
    try:
        until = datetime.now(timezone.utc) + timedelta(minutes=mins) if mins else None
        await app.restrict_chat_member(m.chat.id, u.id, ChatPermissions(can_send_messages=False), until_date=until)
        await m.reply(f"🔇 Đã cấm khẩu {u.mention} ({'vĩnh viễn' if not mins else str(mins) + ' phút'})")
    except ChatAdminRequired: await m.reply("❌ Cần cấp quyền Admin cho Bot!")
    except Exception as e: await m.reply(f"❌ {e}")

@app.on_message(filters.command("khaitro"))
async def cmd_khaitro(_, m):
    if (r := await chk(m)) != "ok": return await deny(m, r)
    u = await get_tu(m)
    if not u: return await m.reply("💡 `/khaitro @user`")
    try:
        await app.restrict_chat_member(m.chat.id, u.id, ChatPermissions(
            can_send_messages=True, can_send_media_messages=True,
            can_send_other_messages=True, can_add_web_page_previews=True))
        await m.reply(f"🔊 Khai khẩu cho {u.mention}")
    except Exception as e: await m.reply(f"❌ {e}")

@app.on_message(filters.command("cam24h"))
async def cmd_cam24h(_, m):
    if (r := await chk(m)) != "ok": return await deny(m, r)
    u = await get_tu(m)
    if not u or u.id in all_adm(): return
    try:
        until = datetime.now(timezone.utc) + timedelta(days=1)
        await app.restrict_chat_member(m.chat.id, u.id, ChatPermissions(can_send_messages=False), until_date=until)
        await m.reply(f"🔇 Cấm khẩu {u.mention} trong 24 giờ!")
    except Exception as e: await m.reply(f"❌ {e}")

@app.on_message(filters.command("trutxuat"))
async def cmd_trutxuat(_, m):
    if (r := await chk(m)) != "ok": return await deny(m, r)
    u = await get_tu(m)
    if not u or u.id in all_adm(): return
    try:
        await app.ban_chat_member(m.chat.id, u.id)
        await app.unban_chat_member(m.chat.id, u.id)
        await m.reply(f"👢 Đã trục xuất kẻ bại trận {u.mention}!")
    except Exception as e: await m.reply(f"❌ {e}")

@app.on_message(filters.command("phongsat"))
async def cmd_phongsat(_, m):
    if (r := await chk(m)) != "ok": return await deny(m, r)
    u = await get_tu(m)
    if not u or u.id in all_adm(): return
    try:
        await app.ban_chat_member(m.chat.id, u.id)
        await m.reply(f"🚫 Phong sát vĩnh viễn {u.mention}!")
    except Exception as e: await m.reply(f"❌ {e}")

@app.on_message(filters.command("giaiphong"))
async def cmd_giaiphong(_, m):
    if (r := await chk(m)) != "ok": return await deny(m, r)
    u = await get_tu(m)
    if not u: return await m.reply("💡 `/giaiphong @user`")
    try:
        await app.unban_chat_member(m.chat.id, u.id)
        await m.reply(f"✅ Giải phóng lệnh cấm cho {u.mention}")
    except Exception as e: await m.reply(f"❌ {e}")

# ==================== HỆ THỐNG MÃ BẢN QUYỀN ====================

@app.on_message(filters.command("capma"))
async def cmd_capma(_, m):
    if not is_adm(m.from_user.id): return
    try:
        p = m.text.split(); days = int(p[1]); devs = int(p[2])
        note = " ".join(p[3:]) if len(p) > 3 else ""
        k = gen_key()
        db["keys"][k] = {"days": days, "devs": devs, "users": [], "note": note, "created": datetime.now().isoformat(), "by": m.from_user.id}
        sdb()
        await m.reply(f"🔑 **MÃ ĐÃ TẠO BỞI ANH KHÔI!**\n`{k}`\n📅 {days} ngày | 💻 {devs} thiết bị | 📝 {note or '-'}")
    except:
        await m.reply("💡 Cú pháp: `/capma <ngày> <số_máy> [ghi chú]`")

@app.on_message(filters.command("huyma"))
async def cmd_huyma(_, m):
    if not is_adm(m.from_user.id): return
    p = m.text.split()
    if len(p) < 2: return await m.reply("💡 `/huyma <KEY>`")
    if p[1] in db["keys"]:
        del db["keys"][p[1]]; sdb()
        await m.reply(f"🗑️ Đã hủy mã `{p[1]}`")
    else: await m.reply("❌ Mã không tồn tại!")

@app.on_message(filters.command("khoma"))
async def cmd_khoma(_, m):
    if not is_adm(m.from_user.id): return
    if not db["keys"]: return await m.reply("📭 Kho mã trống!")
    lines = [f"🔑 `{k}` {v['days']}n ({len(v.get('users',[]))}/{v['devs']} máy) {v.get('note','')}" for k, v in list(db["keys"].items())[:20]]
    await m.reply("📋 **KHO MÃ ANH KHÔI**\n" + "\n".join(lines))

@app.on_message(filters.command("nhapma"))
async def cmd_nhapma(_, m):
    p = m.text.split(); uid = m.from_user.id
    if len(p) < 2: return await m.reply("💡 Cú pháp: `/nhapma <KEY>`")
    k = p[1]
    if k not in db["keys"]: return await m.reply("❌ Mã không hợp lệ!")
    kd = db["keys"][k]
    if uid in kd["users"]: return await m.reply("ℹ️ Ngươi đã kích hoạt mã này trước đó!")
    if len(kd["users"]) >= kd["devs"]: return await m.reply("❌ Mã đã hết lượt sử dụng!")
    exp = datetime.now() + timedelta(days=kd["days"])
    db["users"][uid] = exp.isoformat(); kd["users"].append(uid); sdb()
    await m.reply(f"✅ **KÍCH HOẠT THÀNH CÔNG!**\n📅 Thời hạn: {exp.strftime('%d/%m/%Y %H:%M')}")

@app.on_message(filters.command("kiemtrama"))
async def cmd_kiemtrama(_, m):
    uid = m.from_user.id
    if is_adm(uid): return await m.reply("👑 Anh Khôi Tối Cao – Quyền năng vĩnh cửu!")
    exp = db["users"].get(uid)
    if not exp: return await m.reply("❌ Ngươi chưa sở hữu mã bản quyền!")
    try:
        dt = datetime.fromisoformat(str(exp)); rem = dt - datetime.now()
        if rem.total_seconds() < 0: return await m.reply("⏰ Mã đã hết hạn!")
        await m.reply(f"✅ **BẢN QUYỀN HỢP LỆ**\n📅 Hạn dùng: {dt.strftime('%d/%m/%Y %H:%M')}\n⏳ Còn lại: {rem.days} ngày {rem.seconds // 3600} giờ")
    except: await m.reply("❌ Lỗi dữ liệu mã!")

# ==================== LỆNH ADMIN ĐẶC QUYỀN ====================

@app.on_message(filters.command("phongsoai") & filters.user(SUPER_ADMINS))
async def cmd_phongsoai(_, m):
    u = await get_tu(m)
    if not u: return await m.reply("💡 `/phongsoai @user`")
    if u.id not in db["admins"]:
        db["admins"].append(u.id); sdb()
        await m.reply(f"✅ Đã phong chức **Phó Soái** cho {u.mention}!")
    else: await m.reply("ℹ️ Đã có chức vị!")

@app.on_message(filters.command("baiquan") & filters.user(SUPER_ADMINS))
async def cmd_baiquan(_, m):
    u = await get_tu(m)
    if u and u.id in db["admins"]:
        db["admins"].remove(u.id); sdb()
        await m.reply(f"✅ Đã bãi chức {u.mention}")
    else: await m.reply("ℹ️ Không phải phó soái.")

@app.on_message(filters.command("tongquan") & filters.user(SUPER_ADMINS))
async def cmd_tongquan(_, m):
    sa = "\n".join(f"⭐ `{x}` (Thống soái Anh Khôi)" for x in SUPER_ADMINS)
    pa = "\n".join(f"• `{x}`" for x in db["admins"]) or "Không có"
    await m.reply(f"👮 **HỆ THỐNG ĐIỀU HÀNH ANH KHÔI**\n\n**Chủ Tịch Tối Cao:**\n{sa}\n\n**Phó Soái:**\n{pa}")

@app.on_message(filters.command("khoathanh") & filters.user(SUPER_ADMINS))
async def cmd_khoathanh(_, m):
    p = m.text.split()
    if len(p) < 2: return await m.reply("💡 `/khoathanh on` hoặc `/khoathanh off`")
    db["server_key"] = (p[1].lower() == "on"); sdb()
    await m.reply(f"🔒 Chế độ khóa bản quyền: **{'BẬT' if db['server_key'] else 'TẮT'}**")

@app.on_message(filters.command("camdung") & filters.user(SUPER_ADMINS))
async def cmd_camdung(_, m):
    u = await get_tu(m)
    if not u or u.id in SUPER_ADMINS: return
    if u.id not in db["banned"]:
        db["banned"].append(u.id); sdb(); await m.reply(f"🚫 Phong sát vĩnh viễn {u.mention}")

@app.on_message(filters.command("anhxa") & filters.user(SUPER_ADMINS))
async def cmd_anhxa(_, m):
    u = await get_tu(m)
    if u and u.id in db["banned"]:
        db["banned"].remove(u.id); sdb(); await m.reply(f"✅ Ân xá cho {u.mention}")

@app.on_message(filters.command("napngon") & filters.user(SUPER_ADMINS))
async def cmd_napngon(_, m):
    p = m.text.split(None, 1)
    if len(p) < 2: return await m.reply("💡 `/napngon <câu mới>`")
    new_ins = p[1].strip()
    if not new_ins.rstrip().endswith(")"): new_ins = new_ins + " " + lol()
    _learned_ins.append(new_ins)
    save_learned_insults(_learned_ins)
    await m.reply(f"✅ Đã nạp thêm ngôn từ! Tổng kho: **{len(WAR_INSULTS) + len(_learned_ins)}** câu\n_{new_ins}_")

@app.on_message(filters.command("thongso") & filters.user(SUPER_ADMINS))
async def cmd_thongso(_, m):
    active = sum(1 for v in db.get("tasks", {}).values() if v)
    await m.reply(
        f"📊 **THỐNG SỐ CHIẾN BÁO {BOT_NAME}**\n━━━━━━━━━━━━━━━━\n"
        f"📦 Địa bàn nhóm: **{len(db['groups'])}** | ⚡ Đang đồ sát: **{active}**\n"
        f"🔑 Mã đã cấp: **{len(db['keys'])}** | 👥 Người dùng: **{len(db['users'])}**\n"
        f"🚫 Đã phong sát: **{len(db['banned'])}**\n"
        f"💬 Tổng kho ngôn: **{len(WAR_INSULTS) + len(_learned_ins)}** câu sát thương\n"
        f"⚡ Vận tốc cơ sở: **{db.get('delay', 0.0001)}s** | 🔒 Bản quyền: **{'BẬT' if db['server_key'] else 'TẮT'}**")

# ==================== BẢO VỆ CHỦ NHÂN ANH KHÔI ====================
_BAD_LEXICON = ["chó", "ngu", "đần", "phá", "chửi", "fuck", "shit", "địt", "cút", "mẹ", "phế"]
@app.on_message(filters.all, group=-1)
async def auto_protect_anhkhoi(_, m: Message):
    if not m.from_user or is_adm(m.from_user.id): return
    txt = m.text or m.caption or ""
    for target in PROTECTED:
        if target in txt.lower() and any(w in txt.lower() for w in _BAD_LEXICON):
            try:
                await m.delete()
                await app.restrict_chat_member(m.chat.id, m.from_user.id,
                    ChatPermissions(can_send_messages=False),
                    until_date=datetime.now(timezone.utc) + timedelta(minutes=60))
                await app.send_message(m.chat.id, f"⚠️ Kẻ xúc phạm {m.from_user.mention} đã bị Anh Khôi cấm khẩu 60 phút!\n⚡ {BOT_NAME}")
            except: pass
            break

# ==================== MENU HƯỚNG DẪN CÔNG NĂNG ====================
@app.on_message(filters.command(["lenh", "help", "start"]))
async def cmd_lenh_supreme(_, m):
    uid = m.from_user.id if m.from_user else 0
    base = (
        f"⚡ **{BOT_NAME}** ⚡\n"
        f"👑 Tác giả độc quyền: **Anh Khôi**\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n\n"
        f"**⚔️ HỎA LỰC TẤN CÔNG:**\n"
        f"`/tancoc @user` — Bão hỏa lực nhóm\n"
        f"`/cuongbao @user` — Cuồng nộ x3 luồng cực hạn\n"
        f"`/tamxa @user` — Bắn phá tin nhắn riêng (DM)\n"
        f"`/phatngon <text>` — Xả văn bản chỉ định\n"
        f"`/diemdanh` — Bão số đếm thứ tự\n"
        f"`/baobi` — Mưa ký tự Cyber/Gothic hiện đại\n"
        f"`/satngon @user` — Xả full 100.000 ý tưởng sát thương cao\n"
        f"`/dinhchi` — Ngắt mọi luồng tấn công\n"
        f"`/tocdo` — Chỉnh tốc độ (xuống tới 0.00001s)\n\n"
        f"**🏠 THIẾT LẬP ĐỊA BÀN:**\n"
        f"`/camkhau @user [phút]` — Khóa mõm\n"
        f"`/khaitro @user` — Mở cấm khẩu\n"
        f"`/cam24h @user` — Cấm ngôn 1 ngày\n"
        f"`/trutxuat @user` — Đuổi thành viên\n"
        f"`/phongsat @user` — Cấm vĩnh viễn\n"
        f"`/giaiphong @user` — Gỡ lệnh cấm\n"
        f"`/dondep <số>` — Dọn dẹp tin nhắn rác\n"
        f"`/trieuhoi` — Réo gọi toàn bộ thành viên\n"
        f"`/tracuu @user` — Xem lý lịch đối phương\n\n"
        f"**🔑 BẢN QUYỀN:**\n"
        f"`/nhapma <MÃ>` — Kích hoạt quyền sử dụng\n"
        f"`/kiemtrama` — Kiểm tra thời hạn"
    )
    admin_extra = (
        f"\n\n**👑 QUẢN TRỊ TỐI CAO:**\n"
        f"`/capma` `/huyma` `/khoma`\n"
        f"`/phongsoai` `/baiquan` `/tongquan`\n"
        f"`/khoathanh on/off` · `/camdung` · `/anhxa`\n"
        f"`/lanhtho` · `/napngon` · `/thongso`"
    )
    await m.reply(base + (admin_extra if is_adm(uid) else ""))

async def main():
    await app.start()
    try:
        await app.set_bot_commands([
            BotCommand("lenh", "📋 Danh sách quyền năng"),
            BotCommand("tancoc", "Bão hỏa lực nhóm"),
            BotCommand("cuongbao", "Cuồng nộ x3 luồng cực hạn"),
            BotCommand("tamxa", "Bắn phá tin nhắn riêng"),
            BotCommand("phatngon", "Xả văn bản chỉ định"),
            BotCommand("diemdanh", "Bão số đếm"),
            BotCommand("baobi", "Mưa icon Cyber/Gothic"),
            BotCommand("satngon", "Xả kho ngôn từ 100.000 idea"),
            BotCommand("dinhchi", "Dừng tấn công tức thì"),
            BotCommand("tocdo", "Cài đặt vận tốc"),
            BotCommand("dondep", "Thanh trừng tin nhắn"),
            BotCommand("camkhau", "Khóa mõm mục tiêu"),
            BotCommand("trutxuat", "Đuổi khỏi nhóm"),
            BotCommand("phongsat", "Khóa vĩnh viễn"),
            BotCommand("tracuu", "Tra cứu thông tin"),
            BotCommand("nhapma", "Nhập mã bản quyền"),
            BotCommand("kiemtrama", "Kiểm tra hạn dùng"),
        ])
    except: pass
    await asyncio.Event().wait()

if __name__ == "__main__":
    app.run(main())
