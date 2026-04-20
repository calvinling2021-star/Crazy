import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

async function getWechatToken(integration: { id: string; accessToken: string | null; expiresAt: Date | null; metadata: string | null }): Promise<string> {
  if (integration.accessToken && integration.expiresAt && integration.expiresAt > new Date(Date.now() + 60_000)) {
    return integration.accessToken;
  }
  const { corpId, corpSecret } = JSON.parse(integration.metadata ?? "{}");
  const res = await fetch(`https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpId}&corpsecret=${corpSecret}`);
  const data = await res.json();
  if (data.errcode !== 0) throw new Error(`WeChat token refresh failed: ${data.errmsg}`);
  await prisma.integration.update({
    where: { id: integration.id },
    data: { accessToken: data.access_token, expiresAt: new Date(Date.now() + data.expires_in * 1000) },
  });
  return data.access_token;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { toUser, message } = await req.json();
  if (!toUser || !message) return NextResponse.json({ error: "toUser and message required" }, { status: 400 });

  const integration = await prisma.integration.findUnique({ where: { provider: "wechat" } });
  if (!integration?.accessToken) return NextResponse.json({ error: "WeChat not configured" }, { status: 400 });

  const { agentId } = JSON.parse(integration.metadata ?? "{}");
  const token = await getWechatToken(integration);

  const res = await fetch(`https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      touser: toUser,
      msgtype: "text",
      agentid: agentId,
      text: { content: message },
    }),
  });
  const data = await res.json();
  if (data.errcode !== 0) return NextResponse.json({ error: data.errmsg }, { status: 400 });
  return NextResponse.json({ success: true });
}
