import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

const ADMIN_EMAIL1 = 'strazza.corp@gmail.com';

export async function requireAdmin() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }
  
  const user = await currentUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress;

  if (userEmail !== ADMIN_EMAIL1) {
    redirect('/access-denied');
  }
  
  return { userId, userEmail };
}

export function isAdminUser(email: string | undefined): boolean {
  return email === ADMIN_EMAIL1;
}

export async function getCurrentAdmin() {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }
  
  const user = await currentUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  
  if (!isAdminUser(userEmail)) {
    return null;
  }
  
  return {
    userId,
    email: userEmail,
  };
}