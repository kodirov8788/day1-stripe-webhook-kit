export default function Success() {
  return (
    <div className="container success-container">
      <div className="success-icon">✓</div>
      <h1 className="success-title">Subscription Active!</h1>
      <p className="success-message">
        Your subscription has been successfully created. Check your email for confirmation.
      </p>
      <a href="/" className="link">
        ← Back to home
      </a>
    </div>
  );
}
