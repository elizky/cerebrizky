'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { copy } from '@/lib/copy';
import { googleSignInAction, loginAction } from '@/server/auth-actions';

export function LoginForm({ googleEnabled = false }: { googleEnabled?: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className='space-y-4'>
      <form
        className='space-y-4'
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const result = await loginAction({ email, password });
            if (result?.error) setError(result.error);
          });
        }}
      >
        <div className='space-y-2'>
          <Label htmlFor='email'>{copy.auth.email}</Label>
          <Input
            id='email'
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='password'>{copy.auth.password}</Label>
          <Input
            id='password'
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error ? <p className='text-sm text-destructive'>{error}</p> : null}
        <Button type='submit' className='w-full' disabled={pending}>
          {pending ? copy.auth.signingIn : copy.auth.signIn}
        </Button>
      </form>

      {googleEnabled ? (
        <form action={googleSignInAction}>
          <Button type='submit' variant='outline' className='w-full' disabled={pending}>
            {copy.auth.continueWithGoogle}
          </Button>
        </form>
      ) : null}

      <p className='text-center text-sm text-muted-foreground'>
        {copy.auth.noAccount}{' '}
        <Link href='/register' className='underline'>
          {copy.auth.register}
        </Link>
      </p>
    </div>
  );
}
