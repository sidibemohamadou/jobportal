import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  // In development, check localStorage for profile completion status
  const profileCompleted = user?.profileCompleted || 
    (process.env.NODE_ENV === "development" && localStorage.getItem("profileCompleted") === "true");

  // Enhanced user object with profile completion status
  const enhancedUser = user ? {
    ...user,
    profileCompleted
  } : null;

  return {
    user: enhancedUser,
    isLoading,
    isAuthenticated: !!user,
  };
}
