import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import type { Shop } from '../types';

export function useShops() {
  return useQuery<Shop[]>({
    queryKey: ['shops'],
    queryFn: () => api.get('/shops').then(r => r.data),
  });
}

export function useShop(id: number) {
  return useQuery<Shop>({
    queryKey: ['shops', id],
    queryFn: () => api.get(`/shops/${id}`).then(r => r.data),
    enabled: !!id,
  });
}

export function useCreateShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) =>
      api.post('/shops', data, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shops'] }),
  });
}

export function useUpdateShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      api.put(`/shops/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shops'] }),
  });
}

export function useDeleteShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/shops/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shops'] }),
  });
}
