import { useQuery } from "@tanstack/react-query";
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || "";

export function useQueryDishes() {
  return useQuery({
    queryFn: async () => {
      const url = `${BACKEND_BASE_URL}/api/dishes`;
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`Error fecthing data: ${response.state}`);
      return await response.json();
    },
    queryKey: ["alldishes"],
    initialData: [],
  });
}
