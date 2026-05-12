import axios from "axios";
import crypto from "crypto";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { UserRepository } from "../repositories/UserRepository.js";

const userRepository = new UserRepository();

const stripeApi = axios.create({
  baseURL: "https://api.stripe.com/v1",
  timeout: 20_000
});

const stripeHeaders = () => ({
  Authorization: `Bearer ${env.stripeSecretKey}`,
  "Content-Type": "application/x-www-form-urlencoded"
});

const asForm = (payload) => {
  const form = new URLSearchParams();

  for (const [key, value] of Object.entries(payload)) {
    if (Array.isArray(value)) {
      value.forEach((item) => form.append(key, item));
    } else if (value !== undefined && value !== null) {
      form.append(key, String(value));
    }
  }

  return form;
};

const upsertBillingState = async (userId, patch) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    return null;
  }

  const nextBilling = {
    plan: user.billing?.plan || "free",
    status: user.billing?.status || "inactive",
    stripeCustomerId: user.billing?.stripeCustomerId || null,
    stripeSubscriptionId: user.billing?.stripeSubscriptionId || null,
    currentPeriodEnd: user.billing?.currentPeriodEnd || null,
    ...patch
  };

  return userRepository.updateById(userId, { billing: nextBilling });
};

export class StripeService {
  getPlans() {
    return [
      {
        id: "free",
        name: "Free",
        monthlyPrice: 0,
        features: [
          "Core spice and storm tracking",
          "Basic leaderboard visibility",
          "Limited analytics summaries"
        ]
      },
      {
        id: "pro",
        name: "Pro",
        monthlyPrice: 29,
        stripePriceId: env.stripePriceProMonthly || null,
        features: [
          "Mentat AI analysis and chat guidance",
          "Chrome blocker strict mode",
          "Advanced analytics and distraction ratios",
          "Team optimization workflow"
        ]
      }
    ];
  }

  assertConfigured() {
    if (!env.stripeSecretKey || !env.stripePriceProMonthly) {
      throw new ApiError(503, "Stripe billing is not configured for this environment");
    }
  }

  async ensureCustomer(user) {
    if (user.billing?.stripeCustomerId) {
      return user.billing.stripeCustomerId;
    }

    this.assertConfigured();

    const response = await stripeApi.post(
      "/customers",
      asForm({
        email: user.email,
        name: user.name,
        "metadata[userId]": user.id
      }),
      { headers: stripeHeaders() }
    );

    await upsertBillingState(user.id, {
      stripeCustomerId: response.data.id
    });

    return response.data.id;
  }

  async createCheckoutSession(user) {
    this.assertConfigured();
    const customerId = await this.ensureCustomer(user);
    const response = await stripeApi.post(
      "/checkout/sessions",
      asForm({
        mode: "subscription",
        customer: customerId,
        success_url: env.stripeSuccessUrl,
        cancel_url: env.stripeCancelUrl,
        "line_items[0][price]": env.stripePriceProMonthly,
        "line_items[0][quantity]": 1,
        "allow_promotion_codes": true,
        "metadata[userId]": user.id
      }),
      { headers: stripeHeaders() }
    );

    return {
      id: response.data.id,
      url: response.data.url
    };
  }

  async createPortalSession(user) {
    this.assertConfigured();
    const customerId = await this.ensureCustomer(user);
    const response = await stripeApi.post(
      "/billing_portal/sessions",
      asForm({
        customer: customerId,
        return_url: env.stripePortalReturnUrl
      }),
      { headers: stripeHeaders() }
    );

    return {
      id: response.data.id,
      url: response.data.url
    };
  }

  verifyWebhookSignature(rawBody, signatureHeader) {
    if (!env.stripeWebhookSecret) {
      throw new ApiError(503, "Stripe webhook secret is not configured");
    }

    const parts = Object.fromEntries(
      String(signatureHeader || "")
        .split(",")
        .map((part) => part.split("="))
        .filter(([key, value]) => key && value)
    );

    const timestamp = parts.t;
    const signature = parts.v1;

    if (!timestamp || !signature) {
      throw new ApiError(400, "Stripe signature header is missing required components");
    }

    const payload = `${timestamp}.${rawBody}`;
    const expected = crypto
      .createHmac("sha256", env.stripeWebhookSecret)
      .update(payload, "utf8")
      .digest("hex");

    const a = Buffer.from(expected);
    const b = Buffer.from(signature);

    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      throw new ApiError(400, "Stripe webhook signature verification failed");
    }
  }

  async handleWebhookEvent(event) {
    const object = event?.data?.object || {};
    const userId =
      object.metadata?.userId || object.client_reference_id || object.metadata?.operativeId;

    if (!userId) {
      return { applied: false, reason: "No user metadata present" };
    }

    switch (event.type) {
      case "checkout.session.completed":
        await upsertBillingState(userId, {
          plan: "pro",
          status: "active",
          stripeCustomerId: object.customer || null,
          stripeSubscriptionId: object.subscription || null
        });
        return { applied: true };
      case "customer.subscription.updated":
        await upsertBillingState(userId, {
          plan: object.status === "active" ? "pro" : "free",
          status: object.status || "inactive",
          stripeCustomerId: object.customer || null,
          stripeSubscriptionId: object.id || null,
          currentPeriodEnd: object.current_period_end
            ? new Date(object.current_period_end * 1000)
            : null
        });
        return { applied: true };
      case "customer.subscription.deleted":
        await upsertBillingState(userId, {
          plan: "free",
          status: "canceled",
          stripeSubscriptionId: null,
          currentPeriodEnd: null
        });
        return { applied: true };
      default:
        return { applied: false, reason: `Unhandled event type ${event.type}` };
    }
  }
}
