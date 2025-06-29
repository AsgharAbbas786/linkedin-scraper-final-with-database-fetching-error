export function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 7) {
    return 'This week';
  } else if (diffDays <= 30) {
    return 'This month';
  } else {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  }
}

export function getUpdateStatusColor(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 7) {
    return 'text-green-600 bg-green-50 border-green-200';
  } else if (diffDays <= 30) {
    return 'text-green-500 bg-green-25 border-green-100';
  } else {
    return 'text-amber-600 bg-amber-50 border-amber-200';
  }
}

export function getFullDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function validateLinkedInUrl(url: string): boolean {
  const linkedInRegex = /^https?:\/\/(www\.)?linkedin\.com\/(in|posts|company)\/[a-zA-Z0-9\-_%.]+/;
  return linkedInRegex.test(url);
}

export function extractProfileUrlFromComment(commentData: any): string {
  return commentData.actor?.linkedinUrl || '';
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}