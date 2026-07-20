import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const userEmail = session.user.email;
  // Use a generated ref
  const tx_ref = `tx_${Date.now()}_${userEmail}`;
  
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  
  const payload = {
    tx_ref,
    amount: 9.99,
    currency: "USD",
    redirect_url: `${baseUrl}/premium?success=true`,
    meta: {
      user_email: userEmail
    },
    customer: {
      email: userEmail,
      name: session.user.name || "User",
    },
    customizations: {
      title: "StudyMind Premium",
      description: "Unlock unlimited AI study tools",
    }
  };
  
  try {
    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (data.status === "success" && data.data && data.data.link) {
      return NextResponse.json({ link: data.data.link });
    } else {
      return NextResponse.json({ error: data.message || "Failed to initialize payment" }, { status: 400 });
    }
  } catch (error) {
    console.error("Flutterwave error:", error);
    return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 });
  }
}
