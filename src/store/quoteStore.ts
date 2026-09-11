import { create } from "zustand";

type QuoteStore = {
  quoteId: string | null;
  status: string | null;
  setQuote: (quoteId: string, status: string) => void;
  clearQuote: () => void;
};

export const useQuoteStore = create<QuoteStore>((set) => ({
  quoteId: null,
  status: null,
  setQuote: (quoteId, status) => set({ quoteId, status }),
  clearQuote: () => set({ quoteId: null, status: null }),
}));
