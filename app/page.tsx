'use client';

import { useState, FormEvent } from 'react';

export default function Home() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Stripe Webhook Kit</h1>
      <p className="subtitle">
        Portfolio demo: hardened subscription webhooks
      </p>

      <form className="form" onSubmit={handleSubmit}>
        <input
          type="email"
          className="input"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        <button type="submit" className="button" disabled={loading}>
          {loading ? 'Processing...' : 'Subscribe $10/month'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}
    </div>
  );
}
