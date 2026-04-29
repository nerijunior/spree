import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminClient } from '@/client'

export function useProductMedia(productId: string) {
  return useQuery({
    queryKey: ['products', productId, 'media'],
    queryFn: () => adminClient.products.media.list(productId),
    enabled: !!productId,
  })
}

export function useCreateProductMedia(productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { signed_id: string; alt?: string; position?: number }) =>
      adminClient.products.media.create(productId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', productId, 'media'] })
      queryClient.invalidateQueries({ queryKey: ['products', productId] })
    },
  })
}

export function useUpdateProductMedia(productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...params }: { id: string; alt?: string; position?: number }) =>
      adminClient.products.media.update(productId, id, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', productId, 'media'] })
    },
  })
}

export function useDeleteProductMedia(productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      adminClient.products.media.delete(productId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', productId, 'media'] })
      queryClient.invalidateQueries({ queryKey: ['products', productId] })
    },
  })
}
