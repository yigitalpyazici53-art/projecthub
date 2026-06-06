export function getInitials(
  fullName: string | null | undefined,
  username: string | null | undefined
): string {
  if (fullName && fullName.trim()) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return fullName.trim().slice(0, 2).toUpperCase();
  }
  if (username && username.trim()) {
    return username.trim().slice(0, 2).toUpperCase();
  }
  return "??";
}
