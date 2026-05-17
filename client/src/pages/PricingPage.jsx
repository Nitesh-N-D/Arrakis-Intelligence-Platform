import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import LoadingScreen from "../components/ui/LoadingScreen";
import { useAuth } from "../hooks/useAuth";
import { platformService } from "../services/platformService";

export default function PricingPage() {
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();
  const [plans, setPlans] = useState([]);
  const [billingStatus, setBillingStatus] = useState(user?.billing || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState("");

  useEffect(() => {
    document.title = "Pricing | Arrakis Intelligence Platform";
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [plansResponse, statusResponse] = await Promise.all([
          platformService.billingPlans(),
          accessToken ? platformService.billingStatus() : Promise.resolve({ data: user?.billing || null })
        ]);
        setPlans(plansResponse.data || []);
        setBillingStatus(statusResponse.data || null);
      } catch (loadError) {
        setError(loadError.message || "Unable to load billing information.");
      } finally {
        setLoading(false);
      }
    };

    load().catch(() => {});
  }, [accessToken, user?.billing]);

  const startCheckout = async () => {
    if (!accessToken) {
      navigate("/login");
      return;
    }

    setSubmitting("checkout");
    setError("");
    try {
      const response = await platformService.createCheckoutSession();
      if (response.data?.url) {
        window.location.href = response.data.url;
        return;
      }
      throw new Error("Checkout session did not return a redirect URL.");
    } catch (checkoutError) {
      setError(checkoutError.message || "Unable to start checkout.");
    } finally {
      setSubmitting("");
    }
  };

  const openPortal = async () => {
    if (!accessToken) {
      navigate("/login");
      return;
    }

    setSubmitting("portal");
    setError("");
    try {
      const response = await platformService.createCustomerPortal();
      if (response.data?.url) {
        window.location.href = response.data.url;
        return;
      }
      throw new Error("Customer portal did not return a redirect URL.");
    } catch (portalError) {
      setError(portalError.message || "Unable to open billing portal.");
    } finally {
      setSubmitting("");
    }
  };

  if (loading) {
    return <LoadingScreen label="Loading billing systems..." compact={false} />;
  }

  return (
    <div className="min-h-screen px-6 py-8 md:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.34em] text-white/45">Monetization Layer</div>
            <h1 className="mt-3 font-display text-5xl text-white md:text-6xl">
              Choose your Arrakis command tier
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-white/62">
              Free gives you the core discipline system. Pro unlocks Mentat, strict blocking, and the full analytics surface.
            </p>
          </div>
          <Button onClick={() => navigate("/")} variant="ghost">
            Back to dashboard
          </Button>
        </div>

        {error ? (
          <div className="rounded-card border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-2">
          {plans.map((plan) => {
            const activePlan = (billingStatus?.plan || "free") === plan.id;
            return (
              <Card key={plan.id} className={activePlan ? "border-amber-300/30" : ""}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.34em] text-white/45">Plan</div>
                    <div className="mt-3 font-display text-4xl text-white">{plan.name}</div>
                  </div>
                  {activePlan ? (
                    <div className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-amber-100">
                      Current
                    </div>
                  ) : null}
                </div>
                <div className="mt-4 text-4xl font-semibold text-amber-100">
                  ${plan.monthlyPrice}
                  <span className="ml-2 text-sm text-white/45">/ month</span>
                </div>
                <div className="mt-5 space-y-2">
                  {plan.features.map((feature) => (
                    <div key={feature} className="rounded-button border border-white/8 bg-white/5 px-3 py-2 text-sm text-white/70">
                      {feature}
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  {plan.id === "free" ? (
                    <Button className="w-full" onClick={() => navigate("/")} variant="secondary">
                      Continue on Free
                    </Button>
                  ) : activePlan ? (
                    <Button className="w-full" disabled={submitting === "portal"} onClick={openPortal}>
                      {submitting === "portal" ? "Opening..." : "Manage subscription"}
                    </Button>
                  ) : (
                    <Button className="w-full" disabled={submitting === "checkout"} onClick={startCheckout}>
                      {submitting === "checkout" ? "Redirecting..." : "Upgrade to Pro"}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {!plans.length ? (
          <EmptyState
            title="No pricing plans available"
            description="Billing plans could not be loaded from the backend. Check your Stripe configuration and try again."
          />
        ) : null}
      </div>
    </div>
  );
}
