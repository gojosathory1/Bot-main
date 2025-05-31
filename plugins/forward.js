const l = console.log
const config = require('../settings')
const { cmd, commands } = require('../lib/command');
cmd({
  pattern: "forward",
  desc: "Forward a quoted message to a specified JID",
  alias: ["fo"],
  category: "owner",
  use: '.forward <jid>',
  filename: __filename,
},
async (conn, mek, m, { q, reply, isOwner }) => {
  try {
    if (!isOwner) return reply("*Owner Only ❌*");

    if (!q) return reply("*Please provide the target JID to forward to.*\nUsage: .forward <jid>");
    if (!m.quoted) return reply("*Please reply to a message to forward.*");

    // Construct message object from quoted message
    const messageToForward = m.quoted;

    // Forward message to target JID (q)
    await conn.forwardMessage(q, messageToForward, true);

    return reply(`*Message forwarded to:* \n\n${q}`);
  } catch (err) {
    console.error("Error in forward command:", err);
    return reply("❌ Failed to forward message.");
  }
});
