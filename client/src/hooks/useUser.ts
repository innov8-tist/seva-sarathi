import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export interface User {
  id: string;
  name: string;
  email: string;
  pfp: string;
  provider: string;
  providerid: string;
}

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await api.auth['user-data'].$get();
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      const data = await response.json();
      return data.user as User;
    }
  });
}
