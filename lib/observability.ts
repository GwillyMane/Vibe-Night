import * as Sentry from "@sentry/nextjs";

type ErrorContext = Record<string, unknown>;

function sentryEnabled(): boolean {
  return Boolean(process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN);
}

/** Structured error reporting — logs locally and forwards to Sentry when configured. */
export function reportError(scope: string, error: unknown, context?: ErrorContext): void {
  const payload = {
    scope,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
    at: new Date().toISOString(),
  };
  console.error(`[${scope}]`, payload);

  if (!sentryEnabled()) return;

  Sentry.withScope((s) => {
    s.setTag("scope", scope);
    if (context) s.setContext("details", context);
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)));
  });
}
