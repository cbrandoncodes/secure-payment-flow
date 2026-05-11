import DodoPayments from "dodopayments";

export const dodopayments = new DodoPayments({
  bearerToken: process.env["DODO_PAYMENTS_API_KEY"],
  environment: (process.env?.["DODO_PAYMENTS_ENVIRONMENT"] ?? "test_mode") as
    | "test_mode"
    | "live_mode",
});
