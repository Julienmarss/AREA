export interface GoogleAuthData {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  email?: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  historyId: string;
  internalDate: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body?: {
      data?: string;
    };
  };
  from?: string;
  to?: string;
  subject?: string;
  body?: string;
}

export interface GmailLabel {
  id: string;
  name: string;
  type: string;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  from?: string;
}

export interface GmailActionConfig {
  labelIds?: string[];
  from?: string;
  to?: string;
  subject?: string;
  hasAttachment?: boolean;
}

export interface GmailReactionConfig {
  to: string;
  subject: string;
  body: string;
  labelIds?: string[];
}
