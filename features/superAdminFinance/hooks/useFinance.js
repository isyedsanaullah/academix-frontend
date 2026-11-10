'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import financeApi from '../api/financeApi';
import toast from 'react-hot-toast';

export const FINANCE_QUERY_KEYS = {
  navCounts: (includeTest) => ['finance', 'nav-counts', Boolean(includeTest)],
  overview: (params) => ['finance', 'overview', params],
  payments: (params) => ['finance', 'payments', params],
  paymentDetail: (id) => ['finance', 'payment', id],
  colleges: (params) => ['finance', 'colleges', params],
  collegeDetail: (id) => ['finance', 'college', id],
  accountants: (params) => ['finance', 'accountants', params]
};

export function useNavCounts(includeTest = false, options = {}) {
  return useQuery({
    queryKey: FINANCE_QUERY_KEYS.navCounts(includeTest),
    queryFn: () => financeApi.getNavCounts(includeTest),
    staleTime: 60 * 1000,
    refetchInterval: 120 * 1000,
    ...options
  });
}

export function useAccountingOverview(params = {}) {
  return useQuery({
    queryKey: FINANCE_QUERY_KEYS.overview(params),
    queryFn: () => financeApi.getOverview(params),
    staleTime: 30 * 1000
  });
}

export function usePaymentsHistory(params = {}) {
  return useQuery({
    queryKey: FINANCE_QUERY_KEYS.payments(params),
    queryFn: () => financeApi.getPayments(params),
    placeholderData: (prev) => prev
  });
}

export function usePaymentDetail(id) {
  return useQuery({
    queryKey: FINANCE_QUERY_KEYS.paymentDetail(id),
    queryFn: () => financeApi.getPaymentById(id),
    enabled: Boolean(id)
  });
}

export function useCollegeBilling(params = {}) {
  return useQuery({
    queryKey: FINANCE_QUERY_KEYS.colleges(params),
    queryFn: () => financeApi.getColleges(params),
    placeholderData: (prev) => prev
  });
}

export function useCollegeBillingDetail(id) {
  return useQuery({
    queryKey: FINANCE_QUERY_KEYS.collegeDetail(id),
    queryFn: () => financeApi.getCollegeById(id),
    enabled: Boolean(id)
  });
}

export function useAccountants(params = {}) {
  return useQuery({
    queryKey: FINANCE_QUERY_KEYS.accountants(params),
    queryFn: () => financeApi.getAccountants(params),
    placeholderData: (prev) => prev
  });
}

export function useApprovePaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => financeApi.approvePayment(id, payload),
    onSuccess: () => {
      toast.success('Payment approved and settled successfully');
      queryClient.invalidateQueries({ queryKey: ['finance'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to approve payment');
    }
  });
}

export function useRejectPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => financeApi.rejectPayment(id, payload),
    onSuccess: () => {
      toast.success('Payment rejected');
      queryClient.invalidateQueries({ queryKey: ['finance'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to reject payment');
    }
  });
}

export function useChangePlanMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ collegeId, payload }) => financeApi.changePlan(collegeId, payload),
    onSuccess: (data) => {
      toast.success(data?.message || 'Plan updated successfully');
      queryClient.invalidateQueries({ queryKey: ['finance'] });
    },
    onError: (err) => {
      const code = err.response?.data?.code;
      if (code === 'PAYMENT_IN_PROGRESS') {
        const blocking = err.response?.data?.details?.blockingPayment;
        toast.error(`Cannot change plan: Payment ${blocking?.id?.slice(0, 8)} is under review.`);
      } else if (code === 'CAP_EXCEEDED') {
        toast.error(err.response?.data?.message || 'Usage exceeds target plan limits.');
      } else {
        toast.error(err.response?.data?.message || 'Failed to update plan');
      }
    }
  });
}

