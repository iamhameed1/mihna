import { useState } from "react";

function RegisterPage({ onRegister, setPage }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "job_seeker",
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

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setError("");
      await onRegister(formData);
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <>
      <div className="page-title">
        <p>Account</p>
        <h1>Create account</h1>
        <span>Create a job seeker or company account.</span>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}

        <div className="form-group full">
          <label>Name</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            type="text"
            placeholder="Ahmed"
            required
          />
        </div>

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
            placeholder="At least 8 characters"
            required
          />
        </div>

        <div className="form-group full">
          <label>Account Type</label>
          <select name="role" value={formData.role} onChange={handleChange}>
            <option value="job_seeker">Job Seeker</option>
            <option value="company">Company</option>
          </select>
        </div>

        <button className="submit-btn" type="submit">
          Create Account
        </button>
        <p className="auth-switch">
          Already have an account?{" "}
          <button type="button" onClick={() => setPage("login")}>
            Login
          </button>
        </p>
      </form>
    </>
  );
}

export default RegisterPage;