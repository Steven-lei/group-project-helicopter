import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || "";

export function useQueryGroup() {
  console.log("useQuery");
  return useQuery({
    queryKey: ["group"],
    queryFn: async () => {
      const url = `${BACKEND_BASE_URL}/api/group/`;
      console.log("bacend", url);
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`Error fecthing data: ${response.status}`);
      return await response.json();
    },
    staleTime: 0,
  });
}
export function useQueryGroupMember(id) {
  return useQuery({
    queryKey: ["group", id],
    queryFn: async () => {
      console.log("query", id);
      const response = await fetch(`${BACKEND_BASE_URL}/api/group/${id}`);
      if (!response.ok)
        throw new Error(`Error fecthing data: ${response.status}`);
      const result = await response.json();
      return result.data;
    },
    enabled: !!id,
  });
}

export function useUpdateGroupMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updatedData }) => {
      const response = await axios.patch(
        `${BACKEND_BASE_URL}/api/group/${id}`,
        updatedData,
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["group", variables.id]);
      queryClient.invalidateQueries(["group"]);
      alert("Update Successful!");
    },
    onError: (error) => {
      alert("Update failed: " + error.message);
    },
  });
}
