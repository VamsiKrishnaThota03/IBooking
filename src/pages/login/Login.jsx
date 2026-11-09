import { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/Authcontext";
import { apiRequest } from "../../api";
import Navbar from "../../components/navbar/Navbar";
import "./login.css";

const Login = () => {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const { loading, error, dispatch } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => setCredentials((prev) => ({ ...prev, [e.target.id]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch({ type: "LOGIN_START" });
    try {
      const json = await apiRequest("/auth/login", { method: "POST", body: credentials });
      dispatch({ type: "LOGIN_SUCCESS", payload: { ...json.user, token: json.authtoken } });
      navigate(location.state?.from || "/");
    } catch (err) {
      dispatch({ type: "LOGIN_FAILURE", payload: { message: err.message } });
    }
  };

  return (
    <div className="authPage">
      <Navbar />
      <main className="login">
        <form className="lContainer" onSubmit={handleSubmit}>
          <h1 className="lTitle">Sign in</h1>
          <p className="lSub">Welcome back! Sign in to reserve rooms.</p>
          {error && <div className="lError" role="alert">{error.message}</div>}
          {location.state?.registered && !error && <div className="lSuccess" role="status">Account created. You can sign in now.</div>}
          <label htmlFor="username">Username</label>
          <input type="text" id="username" autoComplete="username" required value={credentials.username} onChange={handleChange} className="lInput" />
          <label htmlFor="password">Password</label>
          <input type="password" id="password" autoComplete="current-password" required value={credentials.password} onChange={handleChange} className="lInput" />
          <button type="submit" disabled={loading} className="btn btn-primary btn-block lButton">
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <p className="lFoot">
            New to IBooking? <Link to="/register">Create an account</Link>
          </p>
        </form>
      </main>
    </div>
  );
};

export default Login;
