import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  KINGS_CROSS_EUSTON_CONTEXT_SUPPLEMENT_ID,
  ONE_WAY_SYSTEM_AREA_CONTEXT_SUPPLEMENT_ID,
  PICCADILLY_CIRCUS_CONTEXT_SUPPLEMENT_ID,
  QUIET_RESIDENTIAL_ROADS_CONTEXT_SUPPLEMENT_ID,
  WATERLOO_BRIDGE_CONTEXT_SUPPLEMENT_ID
} from "../../../../dev/route-runner/curatedRealLondonContextSupplements.ts";

export const runtime = "nodejs";

const CONTEXT_SUPPLEMENT_FILE_BY_ID = new Map<string, string>([
  [PICCADILLY_CIRCUS_CONTEXT_SUPPLEMENT_ID, "piccadillyCircusContextOverpass.json"],
  [WATERLOO_BRIDGE_CONTEXT_SUPPLEMENT_ID, "waterlooBridgeContextOverpass.json"],
  [KINGS_CROSS_EUSTON_CONTEXT_SUPPLEMENT_ID, "kingsCrossEustonContextOverpass.json"],
  [ONE_WAY_SYSTEM_AREA_CONTEXT_SUPPLEMENT_ID, "oneWaySystemAreaContextOverpass.json"],
  [QUIET_RESIDENTIAL_ROADS_CONTEXT_SUPPLEMENT_ID, "quietResidentialRoadsContextOverpass.json"]
]);

export async function GET(request: Request) {
  const supplementId = new URL(request.url).searchParams.get("id") ?? "";
  const fixtureName = CONTEXT_SUPPLEMENT_FILE_BY_ID.get(supplementId);

  if (!fixtureName) {
    return NextResponse.json({ error: "Unknown context supplement." }, { status: 404 });
  }

  const fixturePath = path.join(process.cwd(), "lib", "map-engine", "osm", "fixtures", fixtureName);
  const fixtureJson = await readFile(fixturePath, "utf8");

  return new NextResponse(fixtureJson, {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}
