import "./navbar.css";
import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/Authcontext";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, dispatch } = useContext(AuthContext);

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    navigate("/");
  };

  return (
    <nav className="navbar" aria-label="Main">
      <div className="navContainer container">
        <Link to="/" className="logo">
          <img src={`${process.env.PUBLIC_URL}/favicon.svg`} alt="" width="28" height="28" />
          IBooking
        </Link>
        {user ? (
          <div className="navItems">
            <span className="navUser">Hi, {user.username}</span>
            <button type="button" onClick={handleLogout} className="btn btn-outline navBtn">
              Log out
            </button>
          </div>
        ) : (
          <div className="navItems">
            <Link to="/register" className="btn btn-outline navBtn">
              Register
            </Link>
            <Link to="/login" className="btn btn-light navBtn">
              Sign in
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
