import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../../api";
import Navbar from "../../components/navbar/Navbar";
import "../login/login.css";

const FIELDS = { username: "", email: "", password: "", country: "", city: "", phone: "" };

const Register = () => {
  const [form, setForm] = useState(FIELDS);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.id]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiRequest("/auth/register", { method: "POST", body: form });
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const field = (id, label, props = {}) => (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} className="lInput" required value={form[id]} onChange={handleChange} {...props} />
    </div>
  );

  return (
    <div className="authPage">
      <Navbar />
      <main className="login">
        <form className="lContainer" onSubmit={handleSubmit}>
          <h1 className="lTitle">Create an account</h1>
          <p className="lSub">Register to reserve rooms at any property.</p>
          {error && <div className="lError" role="alert">{error}</div>}
          <div className="lRow">
            {field("username", "Username", { autoComplete: "username" })}
            {field("phone", "Phone", { type: "tel", autoComplete: "tel" })}
          </div>
          <div className="lRow">{field("email", "Email", { type: "email", autoComplete: "email" })}</div>
          <div className="lRow">{field("password", "Password", { type: "password", autoComplete: "new-password", minLength: 6 })}</div>
          <div className="lRow">
            {field("country", "Country", { autoComplete: "country-name" })}
            {field("city", "City", { autoComplete: "address-level2" })}
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary btn-block lButton">
            {loading ? "Creating account…" : "Register"}
          </button>
          <p className="lFoot">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </main>
    </div>
  );
};

export default Register;
