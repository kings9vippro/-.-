import asyncio, random, string, json, re, sys, os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from aiohttp import web
from pyrogram import Client, filters
from pyrogram.types import (
    BotCommand, ChatPermissions, Message,
    InlineKeyboardMarkup, InlineKeyboardButton, CallbackQuery
)
from pyrogram.errors import (
    FloodWait, UserIsBlocked, RPCError,
    PeerIdInvalid, ChatAdminRequired, BadRequest
)

# Kích hoạt uvloop tối ưu hóa đa luồng trên Linux (Render)
if sys.platform != "win32":
    try:
        import uvloop
        uvloop.install()
    except ImportError:
        pass

# ==================== HẠT NHÂN THÔNG SỐ (HARDCODED CỰC HẠN) ====================
# Đóng đinh Token và API_ID để loại bỏ 100% lỗi từ biến môi trường của Render
API_ID       = 32906102
API_HASH     = "9fc3add5b6bf34cc5335a85388f34a0f"
BOT_TOKEN    = "8251965879:AAFHl0iLezOJrjQLxWQHeMc1RoK8ul7-K7g"

# ĐẶC QUYỀN TỐI CAO: ID của Ông chủ. Không bao giờ cần Key.
SUPER_ADMINS = [6094686933] 
PORT         = int(os.environ.get("PORT", 8080))

BOT_NAME     = "亗 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 𝕯𝕺̣̂𝕮 𝕹𝕳𝕬̂́𝕿 𝖁𝕺̂ 𝕹𝖁𝕴 亗"
FREE_BOT     = "@treo_khoi_bot"
PROTECTED    = ["anhkhoi", "anh_khoi", "pham_anh_khoi", "dev_anh_khoi", "6094686933"]

DB_FILE      = "anhkhoi_db.json"
CORPUS_FILE  = "anhkhoi_corpus.json"

# ==================== WATCHDOG: CHỐNG TIẾN TRÌNH CHẾT NGẦM ====================
def global_exception_handler(loop, context):
    msg = context.get("exception", context["message"])
    print(f"[FATAL] KERNEL PANIC: Lỗi hệ thống nghiêm trọng - {msg}")
    # Ép tiến trình tự sát để Render báo lỗi Đỏ và Auto-Restart, không cho phép sống giả
    sys.exit(1)

# ==================== WEB SERVER GIẢ LẬP ĐÁNH LỪA RENDER ====================
async def web_health(request):
    return web.Response(
        text=f"{BOT_NAME}\nSTATUS: KHAOS TITAN ENGINE RUNNING 24/7\nAUTHOR: PHẠM ANH KHÔI\nPORT: {PORT}",
        status=200,
        content_type="text/plain; charset=utf-8"
    )

async def start_render_web_server():
    app_web = web.Application()
    app_web.router.add_get("/", web_health)
    app_web.router.add_get("/health", web_health)
    runner = web.AppRunner(app_web)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", PORT)
    await site.start()
    print(f"[*] Web Server Render đã chiếm quyền thành công Port: {PORT}")

# ==================== CƠ SỞ DỮ LIỆU & BỘ LỌC ĐẶC QUYỀN ====================
def _ddb():
    return dict(server_key=True, users={}, keys={}, tasks={}, banned=[], auth=[], admins=[], delay=0.0001, spam_active={})

def ldb():
    if Path(DB_FILE).exists():
        try:
            d = json.loads(Path(DB_FILE).read_text("utf-8"))
            b = _ddb(); b.update(d)
            b["users"]  = {int(k): v for k, v in b["users"].items()}
            b["banned"] = [int(x) for x in b["banned"]]
            b["auth"]   = [int(x) for x in b["auth"]]
            b["admins"] = [int(x) for x in b["admins"]]
            return b
        except: pass
    return _ddb()

def sdb():
    out = dict(db)
    out["users"] = {str(k): v for k, v in db["users"].items()}
    Path(DB_FILE).write_text(json.dumps(out, ensure_ascii=False, default=str), "utf-8")

db = ldb()

# BYPASS TỐI CAO: Định danh Ông chủ
def all_adm(): return list(set(SUPER_ADMINS + [x for x in db.get("admins", [])]))
def is_adm(u): return u in SUPER_ADMINS or u in db.get("admins", [])

async def chk(msg: Message):
    uid = msg.from_user.id if msg.from_user else 0
    if uid in db["banned"]: return "banned"
    # Dòng lệnh Bypass: Nếu là Ông chủ (SUPER_ADMINS), lập tức trả về "ok", bỏ qua mọi check Key
    if is_adm(uid): return "ok" 
    if uid in db["auth"]: return "ok"
    
    if db["server_key"]:
        exp = db["users"].get(uid)
        if not exp: return "key"
        try:
            if datetime.fromisoformat(str(exp)) < datetime.now(): return "key"
        except: return "key"
    return "ok"

async def deny(msg, r):
    if r == "key": await msg.reply(f"🔑 Cần Mã Kích Hoạt Của Anh Khôi! Cú pháp: `/nhapma <MÃ>`\n👑 Bot: {FREE_BOT}")
    elif r == "banned": await msg.reply("🚫 Ngươi đã bị Anh Khôi phong sát toàn diện!")

# ==================== KHO NGÔN TỪ TỰ ĐỘNG KHỬ TRÙNG LẶP ====================
DEFAULT_CORPUS = [
    "Quỳ xuống trước mặt Anh Khôi Độc Nhất Vô Nhị đi con phế vật",
    "Đẳng cấp của Anh Khôi là thứ cả đời mày không bao giờ chạm tới được",
    "Một đòn thanh tẩy của Anh Khôi đủ xóa sổ cả gia phả nhà mày"
]

def load_corpus():
    unique_set = set(DEFAULT_CORPUS)
    if Path(CORPUS_FILE).exists():
        try:
            raw = json.loads(Path(CORPUS_FILE).read_text("utf-8"))
            for item in raw:
                if isinstance(item, str) and len(item.strip()) >= 3:
                    unique_set.add(item.strip())
        except: pass
    else:
        Path(CORPUS_FILE).write_text(json.dumps(list(unique_set), ensure_ascii=False, indent=2), "utf-8")
    return list(unique_set)

memory_corpus = load_corpus()

def lol(): return "=" + ")" * random.randint(3, 10)
def get_war_insult(): return f"{random.choice(memory_corpus)} {lol()}"

SUOC_MODERN = ["亗 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 𝕯𝕺̣̂𝕮 𝕹𝕳𝕬̂́𝕿 𝖁𝕺̂ 𝕹𝖁𝕴 亗", "𒆜 ☬ 𝕯𝕰𝕬𝕿𝕳 𝕽𝕰𝕬𝕷𝕸 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 ☬ 𒆜"]
ICONS_MODERN = ["亗", "𖤍", "🜲", "⚡", "𒆜", "𒀱"]

def build_war_banner(mention=""):
    m = f"{mention}\n" if mention else ""
    return f"{random.choice(SUOC_MODERN)}\n\n{m}⚡ 亗 𝕬𝕹𝕳 𝕶𝕳𝕺̂𝕴 𝕯𝕺̣̂𝕮 𝕹𝕳𝕬̂́𝕿 𝖁𝕺̂ 𝕹𝖁𝕴 亗 ⚡"

# ==================== KHỞI TẠO CLIENT TELEGRAM LAYER 1 ====================
app = Client("KhaosTitan_Supreme", api_id=API_ID, api_hash=API_HASH, bot_token=BOT_TOKEN)

def gen_key(): return "AK-VIP-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=10))

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

# ==================== LÕI ĐỘNG CƠ TẤN CÔNG ĐA LUỒNG ====================
async def turbo_worker(chat_id, target, mention, mode, content, tid, stats):
    delay = max(float(db.get("delay", 0.0001)), 0.00001)
    while db["tasks"].get(tid):
        try:
            if   mode == "tancoc":   await app.send_message(chat_id, build_war_banner(mention))
            elif mode == "tamxa":    await app.send_message(target,  build_war_banner(mention))
            elif mode == "phatngon": await app.send_message(chat_id, f"{mention}\n{content}")
            elif mode == "baobi":    await app.send_message(chat_id, f"{random.choice(ICONS_MODERN)} {mention} {random.choice(ICONS_MODERN)}")
            elif mode == "satngon":  await app.send_message(chat_id, f"𖤍 {mention + ' ' if mention else ''}{get_war_insult()}")
            
            stats["count"] += 1
            stats["err"] = 0
            await asyncio.sleep(delay if delay > 0.001 else 0.0001)
        except FloodWait as e:
            w = max(e.value, 3)
            try: await app.send_message(chat_id, f"⏳ Bão hòa API {w}s | Đã xả {stats['count']} đòn")
            except: pass
            await asyncio.sleep(w)
        except UserIsBlocked:
            db["tasks"][tid] = False
            sdb()
            break
        except (PeerIdInvalid, BadRequest):
            stats["err"] += 1
            if stats["err"] >= 6:
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
    sdb()
    stats = {"count": 0, "err": 0}
    
    try: await app.send_message(chat_id, f"🚀 **XUNG TRẬN!**\n🎯 Mục tiêu: {mention or target}\n⚡ Chế độ: {mode.upper()} | Luồng: x{workers_count}\n👑 Thống soái: Anh Khôi")
    except: pass

    tasks = [asyncio.create_task(turbo_worker(chat_id, target, mention, mode, content, tid, stats)) for _ in range(workers_count)]

    while db["tasks"].get(tid):
        await asyncio.sleep(300)
        if not db["tasks"].get(tid): break
        try: await app.send_message(chat_id, f"💤 Tạm nghỉ giảm tải 25s | Đã xả: **{stats['count']}** đòn")
        except: pass
        await asyncio.sleep(25)

    db["tasks"][tid] = False
    sdb()
    for t in tasks:
        if not t.done(): t.cancel()
    try: await app.send_message(chat_id, f"🏁 **KẾT THÚC CÀN QUÉT** | Tổng đòn kết liễu: **{stats['count']}**")
    except: pass

# ==================== ĐỊNH TUYẾN LỆNH TELEGRAM ====================
@app.on_message(filters.command("tancoc"))
async def cmd_tancoc(_, m):
    if (r := await chk(m)) != "ok": return await deny(m, r)
    t, mn = await resolve(m)
    if not t: return await m.reply("❌ Cú pháp: `/tancoc @user`")
    asyncio.create_task(supreme_engine(m.chat.id, m.from_user.id, t, mn, "tancoc", workers_count=1))

@app.on_message(filters.command("cuongbao"))
async def cmd_cuongbao(_, m):
    if (r := await chk(m)) != "ok": return await deny(m, r)
    t, mn = await resolve(m)
    if not t: return await m.reply("❌ Cú pháp: `/cuongbao @user`")
    asyncio.create_task(supreme_engine(m.chat.id, m.from_user.id, t, mn, "tancoc", workers_count=3))

@app.on_message(filters.command("tamxa"))
async def cmd_tamxa(_, m):
    if (r := await chk(m)) != "ok": return await deny(m, r)
    t, mn = await resolve(m)
    if not t: return await m.reply("❌ Cú pháp: `/tamxa @user`")
    asyncio.create_task(supreme_engine(m.chat.id, m.from_user.id, t, mn, "tamxa", workers_count=1))

@app.on_message(filters.command("satngon"))
async def cmd_satngon(_, m):
    if (r := await chk(m)) != "ok": return await deny(m, r)
    t, mn = await resolve(m)
    asyncio.create_task(supreme_engine(m.chat.id, m.from_user.id, t or m.chat.id, mn or "", "satngon", workers_count=2))

@app.on_message(filters.command("dinhchi"))
async def cmd_dinhchi(_, m):
    tid = f"{m.chat.id}_{m.from_user.id}"
    if is_adm(m.from_user.id):
        stopped = sum(1 for k in list(db["tasks"]) if str(m.chat.id) in k and db["tasks"].pop(k, False))
        sdb()
        return await m.reply(f"🛑 Anh Khôi đã đình chỉ toàn bộ **{stopped}** chiến dịch!")
    if db["tasks"].get(tid):
        db["tasks"][tid] = False
        sdb()
        await m.reply("🛑 Đã dừng chiến dịch cá nhân!")
    else:
        await m.reply("⚠️ Không có chiến dịch nào đang chạy.")

@app.on_message(filters.command("tocdo"))
async def cmd_tocdo(_, m):
    if (r := await chk(m)) != "ok": return await deny(m, r)
    p = m.text.split()
    if len(p) == 1:
        return await m.reply(f"⚡ **TỐC ĐỘ:** `{db.get('delay', 0.0001)}s`\nGõ: `/tocdo 0.0001`", 
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("⚡ Turbo (0.0001s)", callback_data="akspd_0.0001")]]))
    try:
        v = max(float(p[1].lower().rstrip("s")), 0.00001)
        db["delay"] = v
        sdb()
        await m.reply(f"✅ Đã thiết lập vận tốc: **{v}s/đòn**")
    except: await m.reply("❌ Lỗi định dạng số!")

@app.on_callback_query(filters.regex(r"^akspd_"))
async def cb_speed_ak(_, cq: CallbackQuery):
    v = float(cq.data.split("_")[1])
    db["delay"] = v
    sdb()
    await cq.answer(f"Đã lưu {v}s")
    await cq.message.edit_text(f"✅ Tốc độ hiện tại: **{v}s/đòn**")

# ==================== QUẢN LÝ BẢN QUYỀN (ADMIN CHỈ ĐỊNH) ====================
@app.on_message(filters.command("capma"))
async def cmd_capma(_, m):
    if not is_adm(m.from_user.id): return
    p = m.text.split()
    if len(p) < 3: return await m.reply("💡 Cú pháp: `/capma <ngày> <số_máy>`")
    try:
        days = int(p[1]); devs = int(p[2]); k = gen_key()
        db["keys"][k] = {"days": days, "devs": devs, "users": [], "created": datetime.now().isoformat(), "by": m.from_user.id}
        sdb()
        await m.reply(f"🔑 **MÃ ĐÃ TẠO THÀNH CÔNG!**\n`{k}`\n📅 {days} ngày | 💻 {devs} thiết bị")
    except: await m.reply("❌ Tham số ngày/số máy phải là số nguyên!")

@app.on_message(filters.command("nhapma"))
async def cmd_nhapma(_, m):
    p = m.text.split(); uid = m.from_user.id
    if len(p) < 2: return await m.reply("💡 Cú pháp: `/nhapma <KEY>`")
    k = p[1]
    if k not in db["keys"]: return await m.reply("❌ Mã không hợp lệ!")
    kd = db["keys"][k]
    if uid in kd["users"]: return await m.reply("ℹ️ Bạn đã kích hoạt mã này trước đó!")
    if len(kd["users"]) >= kd["devs"]: return await m.reply("❌ Mã đã hết lượt sử dụng!")
    exp = datetime.now() + timedelta(days=kd["days"])
    db["users"][uid] = exp.isoformat(); kd["users"].append(uid); sdb()
    await m.reply(f"✅ **KÍCH HOẠT THÀNH CÔNG!**\n📅 Thời hạn: {exp.strftime('%d/%m/%Y %H:%M')}")

@app.on_message(filters.command(["lenh", "help", "start"]))
async def cmd_lenh_render(_, m):
    uid = m.from_user.id if m.from_user else 0
    base = (
        f"⚡ **{BOT_NAME}** ⚡\n"
        f"👑 Tác giả độc quyền: **Anh Khôi**\n"
        f"🌐 Hệ thống: **Render Python Engine**\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n\n"
        f"**⚔️ HỎA LỰC TẤN CÔNG:**\n"
        f"`/tancoc @user` | `/cuongbao @user`\n"
        f"`/tamxa @user` | `/satngon @user`\n"
        f"`/dinhchi` | `/tocdo`\n\n"
        f"**🔑 BẢN QUYỀN:** `/nhapma <MÃ>`"
    )
    if is_adm(uid): base += "\n\n**👑 QUẢN TRỊ TỐI CAO:**\n`/capma <ngày> <máy>`"
    await m.reply(base)

# ==================== ENTRYPOINT MAIN BỌC THÉP ====================
async def main():
    # 1. Bọc Global Exception Catcher cho luồng Asyncio để bắt lỗi tử huyệt
    loop = asyncio.get_running_loop()
    loop.set_exception_handler(global_exception_handler)

    # 2. Chiếm Port Render
    await start_render_web_server()
    
    # 3. Kích hoạt Bot
    try:
        await app.start()
        print(f"\n[+] API HANDSHAKE THÀNH CÔNG! Bot đã kết nối Telegram API.")
        print(f"[*] ĐẶC QUYỀN SUPREME BYPASS kích hoạt cho ID: {SUPER_ADMINS}")
    except Exception as e:
        print(f"\n[FATAL] KHÔNG THỂ KẾT NỐI TELEGRAM API: {e}")
        sys.exit(1) # Tự sát nếu Token sai
    
    try:
        await app.set_bot_commands([
            BotCommand("lenh", "📋 Danh sách chức năng"),
            BotCommand("tancoc", "Bão hỏa lực nhóm"),
            BotCommand("cuongbao", "Cuồng nộ x3 luồng cực hạn"),
            BotCommand("tamxa", "Bắn phá tin nhắn riêng"),
            BotCommand("satngon", "Xả kho ngôn từ"),
            BotCommand("dinhchi", "Dừng tấn công tức thì"),
            BotCommand("tocdo", "Cài đặt vận tốc"),
            BotCommand("nhapma", "Nhập mã bản quyền"),
        ])
    except: pass

    # Duy trì tiến trình vĩnh viễn
    await asyncio.Event().wait()

if __name__ == "__main__":
    app.run(main())
