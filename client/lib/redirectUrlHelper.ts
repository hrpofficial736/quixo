export default function getRedirectUrl(name: string): {
  url: string;
  pairingId: string;
} {
  const clientUrl = process.env.NEXT_PUBLIC_CLIENT_URL;
  const pairingId = crypto.randomUUID();
  const status = "WAITING";

  const redirectUrl = `${clientUrl}?name=${name}&pairing_id=${pairingId}&status=${status}`;

  return { url: redirectUrl, pairingId };
}
