export function truncateCompanyName(companyName: string, maxLength: number = 40): string {
  return companyName.length > maxLength
    ? `${companyName.slice(0, maxLength - 3)}...`
    : companyName
}
