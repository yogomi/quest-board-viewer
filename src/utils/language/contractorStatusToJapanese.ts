export default function contractorStatusToJapanese(status: string): string {
  switch (status) {
    case 'request':
      return '申請中';
    case 'accepted':
      return '承認済み';
    case 'rejected':
      return '拒否済み';
    default:
      return status;
  }
}
