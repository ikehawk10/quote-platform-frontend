export type CreateQuoteRequest = {
  first_name: string;
  last_name: string;
  email: string;
  address: string;
  make: string;
  model: string;
  year: number;
  date_of_birth: string;
  vin?: string;
  state: string;
};

export type CreateQuoteResponse = {
  id: string;
  status: string;
};

export class QuotesApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "QuotesApiError";
    this.status = status;
    this.code = code;
  }
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

function toSafeErrorMessage(status: number, code?: string, message?: string): string {
  if (code === "QUOTE_REJECTED" && message) {
    return message;
  }

  if (code === "VALIDATION_ERROR" && message) {
    return message;
  }

  if (status === 400) {
    return "We couldn't submit this quote. Please check your details and try again.";
  }

  if (status === 503 || status === 502) {
    return "The quoting service is temporarily unavailable. Please try again shortly.";
  }

  if (status >= 500) {
    return "Something went wrong while submitting your quote. Please try again.";
  }

  return "Unable to submit your quote. Please try again.";
}

export async function createQuote(
  payload: CreateQuoteRequest,
): Promise<CreateQuoteResponse> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/quotes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new QuotesApiError(
      0,
      "NETWORK_ERROR",
      "Unable to reach the quoting service. Check your connection and try again.",
    );
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (response.status === 202) {
    const data = body as Partial<CreateQuoteResponse> | null;
    if (!data?.id || !data?.status) {
      throw new QuotesApiError(
        response.status,
        "INVALID_RESPONSE",
        "Something went wrong while submitting your quote. Please try again.",
      );
    }

    return {
      id: data.id,
      status: data.status,
    };
  }

  const errorBody = body as
    | { error?: { code?: string; message?: string } }
    | null;

  const code = errorBody?.error?.code ?? "REQUEST_FAILED";
  const rawMessage = errorBody?.error?.message;

  throw new QuotesApiError(
    response.status,
    code,
    toSafeErrorMessage(response.status, code, rawMessage),
  );
}
