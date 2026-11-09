import "./hotel.css";
import Navbar from "../../components/navbar/Navbar";
import Header from "../../components/header/Header";
import MailList from "../../components/mailList/MailList";
import Footer from "../../components/footer/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleArrowLeft, faCircleArrowRight, faCircleXmark, faLocationDot } from "@fortawesome/free-solid-svg-icons";
import { useContext, useEffect, useState } from "react";
import useFetch from "../../hooks/useFetch";
import { Link, useNavigate, useParams } from "react-router-dom";
import { SearchContext, nightsBetween } from "../../context/SearchContext";
import { AuthContext } from "../../context/Authcontext";
import Reserve from "../../components/reserve/Reserve";
import { Empty, ErrorMessage, Loading } from "../../components/status/Status";

const Hotel = () => {
  const { id } = useParams();
  const [slideNumber, setSlideNumber] = useState(0);
  const [open, setOpen] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  const { data, loading, error, reFetch } = useFetch(`/hotels/find/${id}`, null);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { dates, options } = useContext(SearchContext);

  const photos = data?.photos || [];
  const nights = nightsBetween(dates[0].startDate, dates[0].endDate);
  const rooms = options.room || 1;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowLeft") setSlideNumber((n) => (n === 0 ? photos.length - 1 : n - 1));
      if (e.key === "ArrowRight") setSlideNumber((n) => (n === photos.length - 1 ? 0 : n + 1));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, photos.length]);

  const handleOpen = (i) => {
    setSlideNumber(i);
    setOpen(true);
  };

  const handleMove = (direction) => {
    const last = photos.length - 1;
    setSlideNumber((n) => (direction === "l" ? (n === 0 ? last : n - 1) : n === last ? 0 : n + 1));
  };

  const handleClick = () => {
    if (user) setOpenModal(true);
    else navigate("/login", { state: { from: `/hotels/${id}` } });
  };

  return (
    <div>
      <Navbar />
      <Header type="list" />
      <main className="hotelContainer container">
        {loading && <Loading label="Loading property…" />}
        {error && [400, 404].includes(error.status) && (
          <Empty title="We couldn't find this property">
            <Link to="/hotels">Browse all stays</Link>
          </Empty>
        )}
        {error && ![400, 404].includes(error.status) && <ErrorMessage error={error} onRetry={reFetch} />}
        {data && !loading && (
          <>
            {open && photos.length > 0 && (
              <div className="slider" role="dialog" aria-modal="true" aria-label="Photo viewer">
                <button type="button" className="close" aria-label="Close photos" onClick={() => setOpen(false)}>
                  <FontAwesomeIcon icon={faCircleXmark} />
                </button>
                <button type="button" className="arrow" aria-label="Previous photo" onClick={() => handleMove("l")}>
                  <FontAwesomeIcon icon={faCircleArrowLeft} />
                </button>
                <div className="sliderWrapper">
                  <img src={photos[slideNumber]} alt={`${data.name}, ${slideNumber + 1} of ${photos.length}`} className="sliderImg" />
                </div>
                <button type="button" className="arrow" aria-label="Next photo" onClick={() => handleMove("r")}>
                  <FontAwesomeIcon icon={faCircleArrowRight} />
                </button>
              </div>
            )}
            <div className="hotelWrapper">
              <div className="hotelHead">
                <div>
                  <h1 className="hotelTitle">{data.name}</h1>
                  <div className="hotelAddress">
                    <FontAwesomeIcon icon={faLocationDot} />
                    <span>{data.address}</span>
                  </div>
                  <span className="hotelDistance">Excellent location – {data.distance}m from center</span>
                  <span className="hotelPriceHighlight">
                    Book a stay over ${data.cheapestPrice} at this property and get a free airport taxi
                  </span>
                </div>
                <button type="button" className="btn btn-primary bookNow" onClick={handleClick}>
                  Reserve or Book Now!
                </button>
              </div>
              <div className="hotelImages">
                {photos.map((photo, i) => (
                  <button type="button" className="hotelImgWrapper" key={photo + i} onClick={() => handleOpen(i)} aria-label={`Open photo ${i + 1}`}>
                    <img src={photo} alt="" className="hotelImg" loading="lazy" />
                  </button>
                ))}
              </div>
              <div className="hotelDetails">
                <div className="hotelDetailsTexts">
                  <h2 className="hotelSubtitle">{data.title}</h2>
                  <p className="hotelDesc">{data.desc}</p>
                </div>
                <aside className="hotelDetailsPrice">
                  <h3>Perfect for a {nights}-night stay!</h3>
                  <span>
                    Located in <span className="hotelCity">{data.city}</span>
                    {data.rating ? `, rated ${data.rating} out of 5 by guests` : ""}.
                  </span>
                  <p className="hotelTotal">
                    <b>${nights * data.cheapestPrice * rooms}</b> ({nights} night{nights > 1 ? "s" : ""}
                    {rooms > 1 ? `, ${rooms} rooms` : ""})
                  </p>
                  <button type="button" className="btn btn-primary btn-block" onClick={handleClick}>
                    Reserve or Book Now!
                  </button>
                </aside>
              </div>
            </div>
          </>
        )}
      </main>
      <MailList />
      <Footer />
      {openModal && <Reserve setOpen={setOpenModal} hotelId={id} />}
    </div>
  );
};

export default Hotel;
