export type QuoteStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "REJECTED";

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
  status: QuoteStatus | string;
};

export type Quote = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  address: string;
  make: string;
  model: string;
  year: number;
  date_of_birth: string;
  vin: string | null;
  state: string;
  status: QuoteStatus;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
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

function toSafeErrorMessage(
  status: number,
  code?: string,
  message?: string,
  context: "create" | "fetch" = "create",
): string {
  if (code === "QUOTE_REJECTED" && message) {
    return message;
  }

  if (code === "VALIDATION_ERROR" && message) {
    return message;
  }

  if (code === "QUOTE_NOT_FOUND" || status === 404) {
    return "We couldn't find that quote. It may have expired or the link is incorrect.";
  }

  if (status === 400) {
    return context === "fetch"
      ? "We couldn't load this quote. Please check the link and try again."
      : "We couldn't submit this quote. Please check your details and try again.";
  }

  if (status === 503 || status === 502) {
    return "The quoting service is temporarily unavailable. Please try again shortly.";
  }

  if (status >= 500) {
    return context === "fetch"
      ? "Something went wrong while loading your quote. Please try again."
      : "Something went wrong while submitting your quote. Please try again.";
  }

  return context === "fetch"
    ? "Unable to load your quote. Please try again."
    : "Unable to submit your quote. Please try again.";
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function requestJson(
  path: string,
  init?: RequestInit,
): Promise<{ response: Response; body: unknown }> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
      ...init,
    });
  } catch {
    throw new QuotesApiError(
      0,
      "NETWORK_ERROR",
      "Unable to reach the quoting service. Check your connection and try again.",
    );
  }

  const body = await parseJson(response);
  return { response, body };
}

function throwFromErrorBody(
  response: Response,
  body: unknown,
  context: "create" | "fetch",
): never {
  const errorBody = body as
    | { error?: { code?: string; message?: string } }
    | null;

  const code = errorBody?.error?.code ?? "REQUEST_FAILED";
  const rawMessage = errorBody?.error?.message;

  throw new QuotesApiError(
    response.status,
    code,
    toSafeErrorMessage(response.status, code, rawMessage, context),
  );
}

export async function createQuote(
  payload: CreateQuoteRequest,
): Promise<CreateQuoteResponse> {
  const { response, body } = await requestJson("/quotes", {
    method: "POST",
    body: JSON.stringify(payload),
  });

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

  throwFromErrorBody(response, body, "create");
}

export async function getQuote(id: string): Promise<Quote> {
  const { response, body } = await requestJson(`/quotes/${encodeURIComponent(id)}`, {
    method: "GET",
  });

  if (response.status === 200) {
    const data = body as Partial<Quote> | null;
    if (!data?.id || !data?.status) {
      throw new QuotesApiError(
        response.status,
        "INVALID_RESPONSE",
        "Something went wrong while loading your quote. Please try again.",
      );
    }

    return data as Quote;
  }

  throwFromErrorBody(response, body, "fetch");
}
