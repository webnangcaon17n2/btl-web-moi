import { useState } from 'react'
import './Pricing.css'

const plans = [
  {
    id: 1,
    name: 'Basic Plan',
    monthlyPrice: 49,
    yearlyPrice: 25,
    desc: 'Get started on your plant journey with our Basic Plan. It includes personalized plant care guides, access to our app, seasonal planting assistance, and email support.',
    features: [
      'Personalized plant care guides',
      'Access to Aether app',
      'Seasonal planting tips',
      'Email support',
    ],
  },
  {
    id: 2,
    name: 'Premium Plan',
    monthlyPrice: 79,
    yearlyPrice: 40,
    desc: 'Upgrade to our Premium Plan for enhanced features. In addition to the Basic Plan, you will receive video consultations, priority support, and personalized garden recommendations.',
    features: [
      'Everything in Basic',
      'Video consultations',
      'Priority support',
      'Garden recommendations',
    ],
    popular: true,
  },
  {
    id: 3,
    name: 'Ultimate Plan',
    monthlyPrice: 99,
    yearlyPrice: 50,
    desc: 'Experience the full benefits of personalized plant coaching with our Ultimate Plan. Enjoy all the features of the Premium Plan, along with 24/7 chat support and exclusive workshops.',
    features: [
      'Everything in Premium',
      '24/7 chat support',
      'Exclusive workshops',
      'Free monthly plant delivery',
    ],
  },
]

function Pricing() {
  const [isYearly, setIsYearly] = useState(false)

  return (
    <section className="pricing section-padding" id="pricing">
      <div className="container">
        <div className="pricing__header">
          <h2 className="pricing__title">Our Pricing</h2>
          <p className="pricing__subtitle">
            We outline our flexible and affordable options to support you on your journey to optimal plant care and gardening. We believe that everyone deserves access to personalized gardening guidance and resources.
          </p>
        </div>

        {/* Toggle */}
        <div className="pricing__toggle-wrapper">
          <div className="pricing__toggle" id="pricing-toggle">
            <button
              className={`pricing__toggle-btn ${!isYearly ? 'pricing__toggle-btn--active' : ''}`}
              onClick={() => setIsYearly(false)}
              id="pricing-monthly-btn"
            >
              Monthly
            </button>
            <button
              className={`pricing__toggle-btn ${isYearly ? 'pricing__toggle-btn--active' : ''}`}
              onClick={() => setIsYearly(true)}
              id="pricing-yearly-btn"
            >
              Yearly
            </button>
          </div>
          {isYearly && (
            <span className="pricing__save-badge">Save 50% on Yearly</span>
          )}
        </div>

        {/* Cards */}
        <div className="pricing__grid">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={`pricing-card ${plan.popular ? 'pricing-card--popular' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {plan.popular && <span className="pricing-card__badge">Most Popular</span>}

              <h3 className="pricing-card__name">{plan.name}</h3>
              <p className="pricing-card__discount">
                Up to 50% off on Yearly Plan
              </p>
              <p className="pricing-card__desc">{plan.desc}</p>

              <div className="pricing-card__price">
                <span className="pricing-card__amount">
                  ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                </span>
                <span className="pricing-card__period">/month</span>
              </div>

              <button className="pricing-card__btn" id={`choose-plan-${plan.id}`}>
                Choose Plan
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Pricing
