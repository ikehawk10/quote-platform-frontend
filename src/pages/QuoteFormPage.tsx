import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createQuote, QuotesApiError } from "../api/quotes";
import { US_STATE_OPTIONS } from "../config/states";
import { useQuoteStore } from "../store/quoteStore";
import {
  type FieldErrors,
  type QuoteFormValues,
  validateQuoteForm,
} from "../validation/quoteForm";

const initialValues: QuoteFormValues = {
  first_name: "",
  last_name: "",
  email: "",
  address: "",
  date_of_birth: "",
  state: "",
  year: "",
  make: "",
  model: "",
  vin: "",
};

export function QuoteFormPage() {
  const navigate = useNavigate();
  const setQuote = useQuoteStore((state) => state.setQuote);

  const [values, setValues] = useState<QuoteFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof QuoteFormValues>(
    field: K,
    value: QuoteFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const validation = validateQuoteForm(values);
    if (!validation.success) {
      setFieldErrors(validation.errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const result = await createQuote(validation.data);
      setQuote(result.id, result.status);
      navigate(`/quotes/${result.id}`);
    } catch (error) {
      if (error instanceof QuotesApiError) {
        setSubmitError(error.message);
      } else {
        setSubmitError(
          "Something went wrong while submitting your quote. Please try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page">
      <section className="panel">
        <header className="panel-header">
          <p className="eyebrow">Insurance Quote Platform</p>
          <h1>Get a vehicle quote</h1>
          <p className="lede">
            Enter your applicant and vehicle details to start a quote request.
          </p>
        </header>

        <form className="quote-form" onSubmit={handleSubmit} noValidate>
          <fieldset className="form-section">
            <legend>Applicant</legend>
            <div className="field-grid">
              <label className="field">
                <span>First name</span>
                <input
                  name="first_name"
                  autoComplete="given-name"
                  value={values.first_name}
                  disabled={isSubmitting}
                  onChange={(event) =>
                    updateField("first_name", event.target.value)
                  }
                />
                {fieldErrors.first_name ? (
                  <span className="field-error">{fieldErrors.first_name}</span>
                ) : null}
              </label>

              <label className="field">
                <span>Last name</span>
                <input
                  name="last_name"
                  autoComplete="family-name"
                  value={values.last_name}
                  disabled={isSubmitting}
                  onChange={(event) =>
                    updateField("last_name", event.target.value)
                  }
                />
                {fieldErrors.last_name ? (
                  <span className="field-error">{fieldErrors.last_name}</span>
                ) : null}
              </label>

              <label className="field">
                <span>Email</span>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={values.email}
                  disabled={isSubmitting}
                  onChange={(event) => updateField("email", event.target.value)}
                />
                {fieldErrors.email ? (
                  <span className="field-error">{fieldErrors.email}</span>
                ) : null}
              </label>

              <label className="field">
                <span>Date of birth</span>
                <input
                  name="date_of_birth"
                  type="date"
                  value={values.date_of_birth}
                  disabled={isSubmitting}
                  onChange={(event) =>
                    updateField("date_of_birth", event.target.value)
                  }
                />
                {fieldErrors.date_of_birth ? (
                  <span className="field-error">{fieldErrors.date_of_birth}</span>
                ) : null}
              </label>

              <label className="field field-span-2">
                <span>Address</span>
                <input
                  name="address"
                  autoComplete="street-address"
                  value={values.address}
                  disabled={isSubmitting}
                  onChange={(event) =>
                    updateField("address", event.target.value)
                  }
                />
                {fieldErrors.address ? (
                  <span className="field-error">{fieldErrors.address}</span>
                ) : null}
              </label>

              <label className="field">
                <span>State</span>
                <select
                  name="state"
                  value={values.state}
                  disabled={isSubmitting}
                  onChange={(event) => updateField("state", event.target.value)}
                >
                  <option value="">Select a state</option>
                  {US_STATE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.state ? (
                  <span className="field-error">{fieldErrors.state}</span>
                ) : null}
              </label>
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>Vehicle</legend>
            <div className="field-grid">
              <label className="field">
                <span>Vehicle year</span>
                <input
                  name="year"
                  inputMode="numeric"
                  autoComplete="off"
                  value={values.year}
                  disabled={isSubmitting}
                  onChange={(event) => updateField("year", event.target.value)}
                />
                {fieldErrors.year ? (
                  <span className="field-error">{fieldErrors.year}</span>
                ) : null}
              </label>

              <label className="field">
                <span>Vehicle make</span>
                <input
                  name="make"
                  autoComplete="off"
                  value={values.make}
                  disabled={isSubmitting}
                  onChange={(event) => updateField("make", event.target.value)}
                />
                {fieldErrors.make ? (
                  <span className="field-error">{fieldErrors.make}</span>
                ) : null}
              </label>

              <label className="field">
                <span>Vehicle model</span>
                <input
                  name="model"
                  autoComplete="off"
                  value={values.model}
                  disabled={isSubmitting}
                  onChange={(event) => updateField("model", event.target.value)}
                />
                {fieldErrors.model ? (
                  <span className="field-error">{fieldErrors.model}</span>
                ) : null}
              </label>

              <label className="field">
                <span>
                  VIN <em className="optional">(optional)</em>
                </span>
                <input
                  name="vin"
                  autoComplete="off"
                  value={values.vin}
                  disabled={isSubmitting}
                  onChange={(event) => updateField("vin", event.target.value)}
                />
                {fieldErrors.vin ? (
                  <span className="field-error">{fieldErrors.vin}</span>
                ) : null}
              </label>
            </div>
          </fieldset>

          {submitError ? (
            <p className="form-error" role="alert">
              {submitError}
            </p>
          ) : null}

          <button className="submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting…" : "Request quote"}
          </button>
        </form>
      </section>
    </main>
  );
}
