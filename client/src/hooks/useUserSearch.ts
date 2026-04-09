import { useState, useCallback } from 'react';
import { searchUsers } from '../services/userService';
import { User } from '../types/user';

export const useUserSearch = () => {
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const data = await searchUsers(query);
      setResults(data.users);
    } catch (error) {
      console.error('Search error:', error);
    }
    setLoading(false);
  }, []);

  return { results, loading, search };
};
