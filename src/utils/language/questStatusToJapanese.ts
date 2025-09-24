export default function questStatusToJapanese(status: string): string {
  switch (status) {
    case 'new_quest':
      return '新規クエスト';
    case 'open_call':
      return '募集中';
    case 'take_quest_requested':
      return '参加申請中';
    case 'doing':
      return '進行中';
    case 'done':
      return '完了報告済み';
    case 'success':
      return '成功';
    case 'failed':
      return '失敗';
    case 'pending':
      return '保留中';
    case 'feedback':
      return 'フィードバック';
    default:
      return status;
  }
}
