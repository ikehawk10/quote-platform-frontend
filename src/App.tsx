import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QuoteFormPage } from "./pages/QuoteFormPage";
import { QuoteStatusPage } from "./pages/QuoteStatusPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<QuoteFormPage />} />
        <Route path="/quotes/:quoteId" element={<QuoteStatusPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
