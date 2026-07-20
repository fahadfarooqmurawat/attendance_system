"use client";

import { useActionState } from "react";
import { login } from "./actions";
import styles from "./login.module.css";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    <div className={styles.container}>
      <div className={styles.glassCard}>
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>Sign in to your attendance portal</p>

        {state?.error && <div className={styles.error}>{state.error}</div>}

        <form action={formAction} suppressHydrationWarning>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Email Address</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              className={styles.input} 
              placeholder="e.g., owner@test.com"
              required 
              suppressHydrationWarning
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              className={styles.input} 
              placeholder="••••••••"
              required 
              suppressHydrationWarning
            />
          </div>

          <button type="submit" className={styles.button} disabled={isPending} suppressHydrationWarning>
            {isPending ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
