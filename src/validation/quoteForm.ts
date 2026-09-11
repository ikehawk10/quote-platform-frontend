import { z } from "zod";
import { US_STATE_CODES } from "../config/states";

function isAtLeast18(dateOfBirth: string, today = new Date()): boolean {
  const [year, month, day] = dateOfBirth.split("-").map(Number);
  let age = today.getFullYear() - year;
  const hasHadBirthdayThisYear =
    today.getMonth() + 1 > month ||
    (today.getMonth() + 1 === month && today.getDate() >= day);

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return age >= 18;
}

export const quoteFormSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().min(1, "Last name is required"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .pipe(z.email("Enter a valid email address")),
  address: z.string().trim().min(1, "Address is required"),
  date_of_birth: z
    .string()
    .trim()
    .min(1, "Date of birth is required")
    .refine(
      (value) => /^\d{4}-\d{2}-\d{2}$/.test(value),
      "Date of birth must be YYYY-MM-DD",
    )
    .refine(isAtLeast18, "You must be at least 18 years old"),
  state: z
    .string()
    .trim()
    .min(1, "State is required")
    .transform((value) => value.toUpperCase())
    .refine(
      (value): value is (typeof US_STATE_CODES)[number] =>
        (US_STATE_CODES as readonly string[]).includes(value),
      "Select a valid US state",
    ),
  year: z
    .string()
    .trim()
    .min(1, "Vehicle year is required")
    .refine((value) => /^\d+$/.test(value), "Vehicle year must be a number")
    .transform((value) => Number(value))
    .refine((value) => Number.isInteger(value), "Vehicle year must be an integer")
    .refine((value) => value >= 1900, "Vehicle year must be 1900 or later")
    .refine((value) => value <= 2100, "Vehicle year must be 2100 or earlier"),
  make: z.string().trim().min(1, "Vehicle make is required"),
  model: z.string().trim().min(1, "Vehicle model is required"),
  vin: z
    .string()
    .trim()
    .transform((value) => (value === "" ? undefined : value))
    .optional(),
});

export type QuoteFormValues = z.input<typeof quoteFormSchema>;
export type QuoteFormPayload = z.output<typeof quoteFormSchema>;

export type FieldErrors = Partial<Record<keyof QuoteFormValues, string>>;

export function validateQuoteForm(values: QuoteFormValues): {
  success: true;
  data: QuoteFormPayload;
} | {
  success: false;
  errors: FieldErrors;
} {
  const result = quoteFormSchema.safeParse(values);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in errors)) {
      errors[field as keyof QuoteFormValues] = issue.message;
    }
  }

  return { success: false, errors };
}
