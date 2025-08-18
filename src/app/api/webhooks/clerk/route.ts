import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await req.text();
  const body = JSON.parse(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || process.env.CLERK_SECRET_KEY!);

  let evt: any;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as any;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occurred', {
      status: 400
    });
  }

  // Handle the webhook
  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`Clerk webhook with ID ${id} and type ${eventType}`);
  console.log('Webhook body:', body);

  if (eventType === 'user.created') {
    // A user was fully created and verified
    const { email_addresses, id: userId } = evt.data;
    const primaryEmail = email_addresses.find((email: any) => email.id === evt.data.primary_email_address_id);
    
    if (primaryEmail) {
      const email = primaryEmail.email_address;
      console.log(`User created: ${email} with ID: ${userId}`);
      
      try {
        // Check if this is a firm user and complete onboarding
        const result = await convex.mutation(api.firms.completeFirmOnboarding, {
          firmEmail: email,
          clerkUserId: userId,
        });
        
        console.log('Firm onboarding completed:', result);
      } catch (error) {
        console.error('Failed to complete firm onboarding:', error);
        // Don't fail the webhook if this fails
      }
    }
  }

  return new NextResponse('', { status: 200 });
}