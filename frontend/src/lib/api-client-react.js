import { useMutation, useQuery } from '@tanstack/react-query';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

async function request(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    method,
    credentials: 'include',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new Error(result?.error ?? `Request failed (${response.status}).`);
  }

  return response.json();
}

function queryOptions(options, queryKey, path) {
  return {
    ...(options?.query ?? {}),
    queryKey: options?.query?.queryKey ?? queryKey,
    queryFn: () => request(path),
  };
}

function useApiQuery(options, queryKey, path) {
  return useQuery(queryOptions(options, queryKey, path));
}

function useApiMutation(mutationFn) {
  return useMutation({ mutationFn });
}

function queryString(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }
  const result = search.toString();
  return result ? `?${result}` : '';
}

export const getAdminListUsersQueryKey = (params = {}) => ['/api/admin/users', params];
export const getGetDashboardSummaryQueryKey = () => ['/api/dashboard/summary'];
export const getGetDepartmentPerformanceQueryKey = () => ['/api/departments/performance'];
export const getGetPublicComplaintStatsQueryKey = () => ['/api/public/dashboard/stats'];
export const getGetProfileQueryKey = () => ['/api/profile'];
export const getGetSessionQueryKey = () => ['/api/auth/session'];
export const getGetComplaintQueryKey = (id) => ['/api/complaints', id];
export const getListComplaintsQueryKey = (params = {}) => ['/api/complaints', params];
export const getListNotificationsQueryKey = () => ['/api/notifications'];

export const useGetSetupStatus = (options) =>
  useApiQuery(options, ['/api/setup'], '/setup');

export const useGetProfile = (options) =>
  useApiQuery(options, getGetProfileQueryKey(), '/profile');

export const useGetSession = (options) =>
  useApiQuery(options, getGetSessionQueryKey(), '/auth/session');

export const useAuthLogin = () =>
  useApiMutation(({ data }) => request('/auth/login', { method: 'POST', body: data }));

export const useAuthRegister = () =>
  useApiMutation(({ data }) => request('/auth/register', { method: 'POST', body: data }));

export const useAuthLogout = () =>
  useApiMutation(() => request('/auth/logout', { method: 'POST' }));

export const useGetDashboardSummary = (options) =>
  useApiQuery(options, getGetDashboardSummaryQueryKey(), '/dashboard/summary');

export const useGetDepartmentPerformance = (options) =>
  useApiQuery(options, getGetDepartmentPerformanceQueryKey(), '/departments/performance');

export const useGetPublicComplaintStats = (options) =>
  useApiQuery(options, getGetPublicComplaintStatsQueryKey(), '/public/dashboard/stats');

export const useGetComplaint = (id, options) =>
  useApiQuery(options, getGetComplaintQueryKey(id), `/complaints/${encodeURIComponent(id)}`);

export const useListComplaints = (params = {}, options) =>
  useApiQuery(options, getListComplaintsQueryKey(params), `/complaints${queryString(params)}`);

export const useAdminListUsers = (params = {}, options) =>
  useApiQuery(options, getAdminListUsersQueryKey(params), `/admin/users${queryString(params)}`);

export const useListNotifications = (options) =>
  useApiQuery(options, getListNotificationsQueryKey(), '/notifications');

export const useCreateUploadSignature = () =>
  useApiMutation(({ data }) => request('/uploads/signature', { method: 'POST', body: data }));

export const useCreateComplaint = () =>
  useApiMutation(({ data }) => request('/complaints', { method: 'POST', body: data }));

export const useSubmitComplaintFeedback = () =>
  useApiMutation(({ id, data }) =>
    request(`/complaints/${encodeURIComponent(id)}/feedback`, { method: 'POST', body: data }),
  );

export const useUpdateComplaintStatus = () =>
  useApiMutation(({ id, data }) =>
    request(`/complaints/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: data }),
  );

export const useReviewComplaint = () =>
  useApiMutation(({ id, data }) =>
    request(`/complaints/${encodeURIComponent(id)}/review`, { method: 'POST', body: data }),
  );

export const useAdminUpdateUserRole = () =>
  useApiMutation(({ id, data }) =>
    request(`/admin/users/${encodeURIComponent(id)}/role`, { method: 'PATCH', body: data }),
  );

export const useMarkNotificationsRead = () =>
  useApiMutation(({ data }) => request('/notifications/read', { method: 'POST', body: data }));

export const useUpdateProfile = () =>
  useApiMutation(({ data }) => request('/profile', { method: 'PUT', body: data }));
