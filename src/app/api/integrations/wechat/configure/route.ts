import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "PRINCIPAL") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { corpId, corpSecret, agentId } = await req.json();
  if (!corpId || !corpSecret || !agentId) {
    return NextResponse.json({ error: "Corp ID, Corp Secret, and Agent ID are required" }, { status: 400 });
  }

  // Get WeChat Work access token to verify credentials
  const tokenRes = await fetch(
    `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpId}&corpsecret=${corpSecret}`
  );
  const tokenData = await tokenRes.json();
  if (tokenData.errcode !== 0) {
    return NextResponse.json({ error: `WeChat error: ${tokenData.errmsg}` }, { status: 400 });
  }

  await prisma.integration.upsert({
    where: { provider: "wechat" },
    update: {
      accessToken: tokenData.access_token,
      expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      accountEmail: corpId,
      metadata: JSON.stringify({ corpId, corpSecret, agentId }),
    },
    create: {
      provider: "wechat",
      accessToken: tokenData.access_token,
      expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      accountEmail: corpId,
      metadata: JSON.stringify({ corpId, corpSecret, agentId }),
    },
  });

  return NextResponse.json({ success: true });
}
