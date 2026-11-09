import useFetch from "../../hooks/useFetch";
import { ErrorMessage } from "../status/Status";
import "./propertyList.css";

const unsplash = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=60`;
const IMAGES = {
  hotel: unsplash("1568084680786-a84f91d1153c"),
  apartment: unsplash("1522708323590-d24dbb6b0267"),
  resort: unsplash("1520250497591-112f2f40a3f4"),
  villa: unsplash("1613490493576-7fde63acd811"),
  cabin: unsplash("1449158743715-0a90ebb6d2d8"),
};
const PLACEHOLDER = Object.keys(IMAGES).map((key) => ({ key, type: `${key}s`, count: null }));

const PropertyList = () => {
  const { data, loading, error, reFetch } = useFetch("/hotels/countByType");
  if (error) return <ErrorMessage error={error} onRetry={reFetch} />;
  const items = loading || !Array.isArray(data) || !data.length ? PLACEHOLDER : data;

  return (
    <div className="pList">
      {items.map((item) => (
        <div className="pListItem" key={item.key || item.type}>
          <img src={IMAGES[item.key] || IMAGES.hotel} alt="" className="pListImg" loading="lazy" />
          <div className="pListTitles">
            <h3>{item.type}</h3>
            <span>{item.count === null ? "…" : `${item.count} ${item.count === 1 ? "property" : "properties"}`}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PropertyList;
