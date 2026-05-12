import { useState } from "react";

function LoginPage({ onLogin, authMessage, setPage }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setError("");
      await onLogin(formData);
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <>
      <div className="page-title">
        <p>Account</p>
        <h1>Login</h1>
        <span>Login to save jobs or manage company job posts.</span>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}

        {authMessage && <p className="form-success">{authMessage}</p>}

        <div className="form-group full">
          <label>Email</label>
          <input
            name="email"
            value={formData.email}
            onChange={handleChange}
            type="email"
            placeholder="ahmed@example.com"
            required
          />
        </div>

        <div className="form-group full">
          <label>Password</label>
          <input
            name="password"
            value={formData.password}
            onChange={handleChange}
            type="password"
            placeholder="Enter your password"
            required
          />
        </div>

        <button className="submit-btn" type="submit">
          Login
        </button>
        <p className="auth-switch">
          Don&apos;t have an account?{" "}
          <button type="button" onClick={() => setPage("register")}>
            Create one
          </button>
        </p>
      </form>
    </>
  );
}

export default LoginPage;