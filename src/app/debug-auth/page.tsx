import { auth, currentUser } from '@clerk/nextjs/server';

export default async function DebugAuth() {
  const { userId, sessionClaims } = await auth();
  const user = await currentUser();
  
  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Debug Authentication</h1>
        
        <div className="bg-card p-6 rounded-lg border space-y-4">
          <div>
            <h2 className="font-semibold">User ID:</h2>
            <p className="text-sm font-mono bg-muted p-2 rounded">{userId || 'null'}</p>
          </div>
          
          <div>
            <h2 className="font-semibold">Session Claims:</h2>
            <pre className="text-sm font-mono bg-muted p-4 rounded overflow-auto">
              {JSON.stringify(sessionClaims, null, 2)}
            </pre>
          </div>
          
          <div>
            <h2 className="font-semibold">Email from sessionClaims?.email:</h2>
            <p className="text-sm font-mono bg-muted p-2 rounded">
              {sessionClaims?.email as string || 'undefined'}
            </p>
          </div>
          
          <div>
            <h2 className="font-semibold">Expected Admin Email:</h2>
            <p className="text-sm font-mono bg-muted p-2 rounded">harrisonyenwe@gmail.com</p>
          </div>
          
          <div>
            <h2 className="font-semibold">Email Match:</h2>
            <p className="text-sm font-mono bg-muted p-2 rounded">
              {(sessionClaims?.email as string) === 'harrisonyenwe@gmail.com' ? 'TRUE' : 'FALSE'}
            </p>
          </div>
          
          <div>
            <h2 className="font-semibold">Current User Object:</h2>
            <pre className="text-sm font-mono bg-muted p-4 rounded overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
          
          <div>
            <h2 className="font-semibold">Primary Email (user.primaryEmailAddress?.emailAddress):</h2>
            <p className="text-sm font-mono bg-muted p-2 rounded">
              {user?.primaryEmailAddress?.emailAddress || 'undefined'}
            </p>
          </div>
          
          <div>
            <h2 className="font-semibold">Primary Email Match:</h2>
            <p className="text-sm font-mono bg-muted p-2 rounded">
              {user?.primaryEmailAddress?.emailAddress === 'harrisonyenwe@gmail.com' ? 'TRUE' : 'FALSE'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}