import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const ADMIN_EMAIL = 'harrisonyenwe@gmail.com';

export async function GET() {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ isAdmin: false, email: null });
    }
    
    const userEmail = user.primaryEmailAddress?.emailAddress;
    const isAdmin = userEmail === ADMIN_EMAIL;
    
    return NextResponse.json({ 
      isAdmin, 
      email: userEmail,
      userId: user.id 
    });
  } catch (error) {
    console.error('Error verifying admin:', error);
    return NextResponse.json({ isAdmin: false, email: null });
  }
}