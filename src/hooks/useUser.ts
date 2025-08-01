import { useUserContext } from '../contexts/UserContext';

export const useUser = () => {
  const { user, setUser } = useUserContext();
  return { user, setUser };
};
