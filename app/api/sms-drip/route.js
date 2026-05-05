import twilio from "twilio";
import { aiReply } from "@/lib/ai";

const client =
  process.env.TWILIO_SID &&
  process.env.TWILIO_AUTH_TOKEN
    ? twilio(
        process.env.TWILIO_SID,
        process.env.TWILIO_AUTH_TOKEN
      )
    : null;

export async function POST(req) {
  try {
    const body = await req.json();

    const msg = body?.Body;
    const from = body?.From;

    if (!msg || !from) return new Response("OK");

    const reply = await aiReply(msg);

    if (client) {
      await client.messages.create({
        body: reply,
        from: process.env.TWILIO_PHONE,
        to: from,
      });
    }

    return new Response("OK");
  } catch {
    return new Response("OK");
  }
}