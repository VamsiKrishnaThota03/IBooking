import { Link } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import { Empty, ErrorMessage, Loading } from "../status/Status";
import "./featuredProperties.css";

const FeaturedProperties = () => {
  const { data, loading, error, reFetch } = useFetch("/hotels?featured=true&limit=4");

  if (loading) return <Loading label="Loading featured stays…" />;
  if (error) return <ErrorMessage error={error} onRetry={reFetch} />;
  if (!data.length) return <Empty title="No featured stays yet">Mark a hotel as featured to show it here.</Empty>;

  return (
    <div className="fp">
      {data.map((item) => (
        <Link to={`/hotels/${item._id}`} className="fpItem" key={item._id}>
          <img src={item.photos?.[0]} alt="" className="fpImg" loading="lazy" />
          <div className="fpBody">
            <span className="fpName">{item.name}</span>
            <span className="fpCity">{item.city}</span>
            <span className="fpPrice">From ${item.cheapestPrice} / night</span>
            {item.rating ? (
              <span className="rating">
                <b>{item.rating}</b> Excellent
              </span>
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  );
};

export default FeaturedProperties;
