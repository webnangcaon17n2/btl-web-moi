import { useState } from 'react'
import { FiSend } from 'react-icons/fi'
import { PiLeafFill } from 'react-icons/pi'
import './Newsletter.css'

function Newsletter() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (email) {
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
      setEmail('')
    }
  }

  return (
    <section className="newsletter section-padding" id="newsletter">
      <div className="container">
        <div className="newsletter__card">
          <div className="newsletter__decoration">
            <div className="newsletter__circle newsletter__circle--1"></div>
            <div className="newsletter__circle newsletter__circle--2"></div>
            <div className="newsletter__leaf newsletter__leaf--1"><PiLeafFill size={24} /></div>
            <div className="newsletter__leaf newsletter__leaf--2"><PiLeafFill size={20} /></div>
          </div>

          <div className="newsletter__content">
            <span className="newsletter__tag">Stay Connected</span>
            <h2 className="newsletter__title">Get Plant Care Tips & Exclusive Offers</h2>
            <p className="newsletter__subtitle">
              Join our community of 25,000+ plant lovers. Receive weekly tips, exclusive deals, and early access to new arrivals.
            </p>

            <form className="newsletter__form" onSubmit={handleSubmit} id="newsletter-form">
              <div className="newsletter__input-wrapper">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="newsletter__input"
                  id="newsletter-email"
                  required
                />
                <button type="submit" className="newsletter__submit" id="newsletter-submit">
                  {submitted ? 'Subscribed!' : 'Subscribe'}
                  {!submitted && <FiSend size={16} />}
                </button>
              </div>
            </form>

            <p className="newsletter__privacy">
              By subscribing, you agree to our Privacy Policy. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Newsletter
