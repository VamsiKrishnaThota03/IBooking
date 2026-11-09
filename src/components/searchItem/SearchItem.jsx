import { Link } from "react-router-dom";
import "./searchItem.css";

const SearchItem = ({ item }) => (
  <article className="searchItem">
    <img src={item.photos?.[0]} alt="" className="siImg" loading="lazy" />
    <div className="siDesc">
      <h2 className="siTitle">{item.name}</h2>
      <span className="siDistance">
        <span className="siCity">{item.city}</span> · {item.distance}m from center
      </span>
      <span className="siTaxiOp">Free airport taxi</span>
      <span className="siSubtitle">{item.title}</span>
      <span className="siFeatures">{item.desc}</span>
      <span className="siCancelOp">Free cancellation</span>
    </div>
    <div className="siDetails">
      {item.rating ? (
        <span className="rating siRating">
          Excellent <b>{item.rating}</b>
        </span>
      ) : (
        <span />
      )}
      <div className="siDetailTexts">
        <span className="siPrice">${item.cheapestPrice}</span>
        <span className="siTaxOp">per night, includes taxes and fees</span>
        <Link to={`/hotels/${item._id}`} className="btn btn-primary">
          See availability
        </Link>
      </div>
    </div>
  </article>
);

export default SearchItem;
