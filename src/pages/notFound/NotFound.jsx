import { Link } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import { Empty } from "../../components/status/Status";

const NotFound = () => (
  <div>
    <Navbar />
    <main className="container" style={{ padding: "64px 0" }}>
      <Empty title="Page not found">
        <Link to="/">Back to the home page</Link>
      </Empty>
    </main>
  </div>
);

export default NotFound;
