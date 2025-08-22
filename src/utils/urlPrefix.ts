export function getUrlPrefix(): string {
  // 優先: 環境変数、次点: グローバル、最後に既定
  const fromVite =
    (import.meta as any)?.env?.VITE_URL_PREFIX as string | undefined
  const fromGlobal = (window as any).__QB_URL_PREFIX__ as string | undefined
  return fromVite || fromGlobal || '/quest-board'
}

export function api(path: string): string {
  const prefix = getUrlPrefix()
  return `${prefix}/api/v1${path}`
}
