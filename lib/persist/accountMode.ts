/** When true, game state lives in account cache + Postgres — not localStorage. */
let accountMode = false;

export function isAccountMode(): boolean {
  return accountMode;
}

export function setAccountMode(on: boolean): void {
  accountMode = on;
}
