export async function sendSMS(phone, message) {
  console.log("SMS:", phone, message);
  return { success: true };
}
