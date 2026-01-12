import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export function GET() {
  const clientUrl = process.env.NEXT_PUBLIC_CLIENT_URL;
  if (!clientUrl) {
    return NextResponse.json({
      message: "Client url not found!",
      status: 404,
    });
  }
  const pairingId = nanoid(21);

  const redirectUrl = `${clientUrl}/${pairingId}`;

  return NextResponse.json({ url: redirectUrl, pairingId });
}
