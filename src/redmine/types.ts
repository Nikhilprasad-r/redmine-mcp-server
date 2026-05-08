/** Redmine JSON error envelope */
export type RedmineErrorsBody = {
  errors?: string[];
};

export type RedmineListMeta = {
  total_count?: number;
  offset?: number;
  limit?: number;
};
