require("dotenv").config()
const { Telegraf } = require("telegraf")

const db = require("./firebase")
const { categories, adminChat } = require("./config")
const { generateCode } = require("./utils")

const bot = new Telegraf(process.env.BOT_TOKEN)
const OWNER_ID = Number(process.env.OWNER_ID)

/* ================= START ================= */
bot.start((ctx) => {
  ctx.reply(`🔥 BOT READY

Kirim kode untuk akses.
Owner: /create <kategori>`)
})

/* ================= OWNER CREATE ================= */
bot.command("create", async (ctx) => {
  if (ctx.from.id !== OWNER_ID) return ctx.reply("❌ Bukan owner")

  const type = ctx.message.text.split(" ")[1]

  if (!categories[type]) {
    return ctx.reply(
`❌ Kategori salah

Pilih:
${Object.keys(categories).join("\n")}`
    )
  }

  const code = generateCode(type)

  await db.collection("codes").doc(code).set({
    code,
    type,
    used: false,
    createdAt: Date.now()
  })

  ctx.reply(`✅ Kode dibuat:\n${code}\nKategori: ${type}`)
})

/* ================= BUYER ACCESS ================= */
bot.on("text", async (ctx) => {
  const code = ctx.message.text.trim()

  const ref = db.collection("codes").doc(code)
  const snap = await ref.get()

  if (!snap.exists) return ctx.reply("❌ Kode tidak valid")

  const data = snap.data()

  if (data.used) return ctx.reply("❌ Kode sudah dipakai")

  const CHAT_ID = categories[data.type]

  if (!CHAT_ID) return ctx.reply("❌ Channel tidak ditemukan")

  try {
    const link = await ctx.telegram.createChatInviteLink(CHAT_ID, {
      member_limit: 1,
      expire_date: Math.floor(Date.now() / 1000) + 300
    })

    await ref.update({
      used: true,
      usedBy: ctx.from.id
    })

    ctx.reply(
`✅ ACCESS GRANTED

Kategori: ${data.type}

🔗 ${link.invite_link}
(1x pakai)`
    )

    await ctx.telegram.sendMessage(adminChat,
`📥 NEW ACCESS
User: ${ctx.from.first_name}
Kategori: ${data.type}
Kode: ${code}`
    )

  } catch (err) {
    console.log(err)
    ctx.reply("❌ Error system")
  }
})

bot.launch()
console.log("BOT RUNNING")
