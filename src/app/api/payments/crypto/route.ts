import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const userEmail = session.user.email;
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  
  const payload = {
    name: "StudyMind Premium",
    description: "Unlock unlimited AI study tools",
    pricing_type: "fixed_price",
    local_price: {
      amount: "9.99",
      currency: "USD"
    },
    metadata: {
      user_email: userEmail
    },
    redirect_url: `${baseUrl}/premium?success=true`,
    cancel_url: `${baseUrl}/premium?canceled=true`
  };
  
  try {
    const response = await fetch("https://api.commerce.coinbase.com/charges", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CC-Api-Key": process.env.COINBASE_COMMERCE_API_KEY || "",
        "X-CC-Version": "2018-03-22"
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (data.data && data.data.hosted_url) {
      return NextResponse.json({ link: data.data.hosted_url });
    } else {
      return NextResponse.json({ error: "Failed to generate crypto payment link" }, { status: 400 });
    }
  } catch (error) {
    console.error("Coinbase error:", error);
    return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 });
  }
}
