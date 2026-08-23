export function getPublicEnv() {
  return {
    repositoryUrl: process.env.NEXT_PUBLIC_GITHUB_REPOSITORY_URL ?? 'https://github.com/ChimdumebiNebolisa/CarryOS',
  }
}
