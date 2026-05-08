const crypto = require("crypto");

function buildKey(email, phone, city) {
  return crypto
    .createHash("sha256")
    .update(`${email || ""}-${phone || ""}-${city || ""}`)
    .digest("hex");
}

module.exports = { buildKey };