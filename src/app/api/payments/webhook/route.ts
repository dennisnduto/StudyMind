import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const flutterwaveHash = req.headers.get("verif-hash");
    const coinbaseSignature = req.headers.get("x-cc-webhook-signature");
    
    // Read the raw body as text for signature verification
    const rawBody = await req.text();
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    let userEmail = "";
    let isSuccessful = false;

    // --- FLUTTERWAVE ---
    if (flutterwaveHash) {
      const secretHash = process.env.FLUTTERWAVE_HASH;
      if (!secretHash || flutterwaveHash !== secretHash) {
        return NextResponse.json({ error: "Invalid Flutterwave hash" }, { status: 401 });
      }

      // Check if payment was successful
      if (body.event === "charge.completed" && body.data.status === "successful") {
        userEmail = body.data.customer.email || body.data.meta?.user_email;
        isSuccessful = true;
      }
    } 
    // --- COINBASE COMMERCE ---
    else if (coinbaseSignature) {
      const webhookSecret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        return NextResponse.json({ error: "Missing Coinbase Webhook Secret" }, { status: 500 });
      }

      // Verify signature
      try {
        const signature = crypto
          .createHmac("sha256", webhookSecret)
          .update(rawBody)
          .digest("hex");
          
        if (signature !== coinbaseSignature) {
          return NextResponse.json({ error: "Invalid Coinbase signature" }, { status: 401 });
        }
      } catch {
        return NextResponse.json({ error: "Signature verification failed" }, { status: 401 });
      }

      // Check event type
      if (body.event?.type === "charge:confirmed" || body.event?.type === "charge:resolved") {
        userEmail = body.event.data.metadata?.user_email;
        isSuccessful = true;
      }
    } 
    else {
      return NextResponse.json({ error: "Unknown webhook source" }, { status: 400 });
    }

    // Process the upgrade if successful
    if (isSuccessful && userEmail) {
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

      await prisma.user.update({
        where: { email: userEmail },
        data: {
          plan: "PREMIUM",
          premiumUntil: oneYearFromNow,
        },
      });
      
      console.log(`Successfully upgraded user ${userEmail} to PREMIUM via webhook.`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
