export interface GitHubRepoRef {
  owner: string;
  repo: string;
}

export interface GitHubIssueRef extends GitHubRepoRef {
  issue_number: number;
}

export interface GitHubPRRef extends GitHubRepoRef {
  pull_number: number;
}

export interface CreateIssueParams extends GitHubRepoRef {
  title: string;
  body?: string;
  labels?: string[];
}

export interface CommentParams extends GitHubRepoRef {
  issue_number: number;
  body: string;
}

export interface CreateRepoParams {
  name: string;
  private?: boolean;
  description?: string;
}

// Trigger payloads
export interface NewIssueCreatedData {
  repository: GitHubRepoRef;
  issue: {
    number: number;
    title: string;
    body?: string;
    user: { login: string; id: number };
    labels: string[];
    html_url: string;
  };
}

export interface PullRequestOpenedData {
  repository: GitHubRepoRef;
  pull_request: {
    number: number;
    title: string;
    body?: string;
    user: { login: string; id: number };
    html_url: string;
    head: { ref: string; sha: string };
    base: { ref: string; sha: string };
  };
}

export interface CommitPushedData {
  repository: GitHubRepoRef;
  ref: string;
  commits: Array<{ id: string; message: string; author: { name: string; email: string } }>;
  pusher: { name: string; email?: string };
}

export interface RepositoryStarredData {
  repository: GitHubRepoRef;
  sender: { login: string; id: number };
  starred_at?: string;
}
