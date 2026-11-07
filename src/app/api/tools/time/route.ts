export async function GET() {
  const now = new Date();
  return Response.json({
    iso: now.toISOString(),
    utc: now.toUTCString(),
    unix: Math.floor(now.getTime() / 1000),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
}