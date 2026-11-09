import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import { SearchContext } from "../../context/SearchContext";
import { ErrorMessage } from "../status/Status";
import "./featured.css";

const unsplash = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=60`;
const CITIES = [
  { key: "berlin", name: "Berlin", img: unsplash("1560969184-10fe8719e047") },
  { key: "madrid", name: "Madrid", img: unsplash("1539037116277-4db20889f2d4") },
  { key: "london", name: "London", img: unsplash("1513635269975-59663e0ac1ad") },
];

const Featured = () => {
  const { data, loading, error, reFetch } = useFetch(`/hotels/countByCity?cities=${CITIES.map((c) => c.key).join(",")}`);
  const search = useContext(SearchContext);
  const navigate = useNavigate();

  const open = (city) => {
    const payload = { destination: city.name, dates: search.dates, options: search.options };
    search.dispatch({ type: "NEW_SEARCH", payload });
    navigate("/hotels", { state: payload });
  };

  if (error) return <ErrorMessage error={error} onRetry={reFetch} />;

  return (
    <div className="featured">
      {CITIES.map((city, i) => (
        <button type="button" className="featuredItem" key={city.key} onClick={() => open(city)}>
          <img src={city.img} alt="" className="featuredImg" loading="lazy" />
          <div className="featuredTitles">
            <h3>{city.name}</h3>
            <span>{loading ? "…" : `${data[i] ?? 0} properties`}</span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default Featured;
