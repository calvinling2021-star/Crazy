import { dataRoomReadiness } from "@/lib/cdp";

export function GET() {
  return Response.json(dataRoomReadiness());
}
