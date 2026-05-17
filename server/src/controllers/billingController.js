import { StripeService } from "../services/stripeService.js";
import { ApiError } from "../utils/ApiError.js";

const stripeService = new StripeService();

export class BillingController {
  async plans(_req, res) {
    res.json({
      success: true,
      data: stripeService.getPlans()
    });
  }

  async status(req, res) {
    res.json({
      success: true,
      data: req.user.billing || { plan: "free", status: "inactive" }
    });
  }

  async checkout(req, res) {
    const session = await stripeService.createCheckoutSession(req.user);
    res.status(201).json({ success: true, data: session });
  }

  async portal(req, res) {
    const session = await stripeService.createPortalSession(req.user);
    res.json({ success: true, data: session });
  }

  async webhook(req, res) {
    stripeService.verifyWebhookSignature(req.rawBody, req.headers["stripe-signature"]);
    let event;

    try {
      event = JSON.parse(req.rawBody || "{}");
    } catch (_error) {
      throw new ApiError(400, "Stripe webhook payload was not valid JSON");
    }

    const result = await stripeService.handleWebhookEvent(event);
    res.json({ success: true, data: result });
  }
}
