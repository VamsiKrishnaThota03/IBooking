import "./navbar.css";
import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/Authcontext";
const Navbar = () => {
  let history = useNavigate();
  const { user } = useContext(AuthContext);
  const handleLogout=()=>{
    localStorage.removeItem('token');
    history('/');
}
  return (
    <div className="navbar">
      <div className="navContainer">
        <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>
          <span className="logo">lamabooking</span>
        </Link>
        {!localStorage.getItem('token') ? <form className="d-flex mx-3" role="search">
          <Link type="button" to='/login' className="btn btn-primary mx-3">Login</Link>
          <Link type="button" to='/register' className="btn btn-primary">Sign Up</Link>

        </form> : <button onClick={handleLogout} className='btn btn-primary'>Logout</button>}
      </div>
    </div>
  );
};

export default Navbar;
