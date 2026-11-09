import { faBed, faCalendarDays, faCar, faPerson, faPlane, faTaxi } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./header.css";
import { DateRange } from "react-date-range";
import { useContext, useEffect, useRef, useState } from "react";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { format } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { SearchContext } from "../../context/SearchContext";
import { AuthContext } from "../../context/Authcontext";

// Closes a popover when clicking outside of it.
const useClickOutside = (ref, onOutside) => {
  useEffect(() => {
    const handler = (e) => ref.current && !ref.current.contains(e.target) && onOutside();
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onOutside]);
};

const Counter = ({ label, value, min, onChange }) => (
  <div className="optionItem">
    <span className="optionText">{label}</span>
    <div className="optionCounter">
      <button type="button" disabled={value <= min} className="optionCounterButton" aria-label={`Fewer ${label}`} onClick={() => onChange(value - 1)}>
        −
      </button>
      <span className="optionCounterNumber" aria-live="polite">{value}</span>
      <button type="button" className="optionCounterButton" aria-label={`More ${label}`} onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  </div>
);

const Header = ({ type }) => {
  const search = useContext(SearchContext);
  const [destination, setDestination] = useState(search.destination || "");
  const [openDate, setOpenDate] = useState(false);
  const [dates, setDates] = useState(search.dates);
  const [openOptions, setOpenOptions] = useState(false);
  const [options, setOptions] = useState(search.options);
  const dateRef = useRef(null);
  const optionsRef = useRef(null);
  useClickOutside(dateRef, () => setOpenDate(false));
  useClickOutside(optionsRef, () => setOpenOptions(false));

  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const setOption = (name, value) => setOptions((prev) => ({ ...prev, [name]: value }));

  const handleSearch = (e) => {
    e.preventDefault();
    const payload = { destination: destination.trim(), dates, options };
    search.dispatch({ type: "NEW_SEARCH", payload });
    navigate("/hotels", { state: payload });
  };

  return (
    <header className={type === "list" ? "header listMode" : "header"}>
      <div className="headerContainer container">
        <div className="headerList">
          <span className="headerListItem active">
            <FontAwesomeIcon icon={faBed} />
            <span>Stays</span>
          </span>
          <span className="headerListItem">
            <FontAwesomeIcon icon={faPlane} />
            <span>Flights</span>
          </span>
          <span className="headerListItem">
            <FontAwesomeIcon icon={faCar} />
            <span>Car rentals</span>
          </span>
          <span className="headerListItem">
            <FontAwesomeIcon icon={faTaxi} />
            <span>Airport taxis</span>
          </span>
        </div>
        {type !== "list" && (
          <>
            <h1 className="headerTitle">Find your next stay</h1>
            <p className="headerDesc">Search hotels, apartments, villas and cabins, then reserve the rooms you want in a few clicks.</p>
            {!user && (
              <Link to="/register" className="btn btn-primary headerCta">
                Sign in / Register
              </Link>
            )}
            <form className="headerSearch" onSubmit={handleSearch} role="search">
              <div className="headerSearchItem headerSearchDest">
                <FontAwesomeIcon icon={faBed} className="headerIcon" />
                <label htmlFor="destination" className="visually-hidden">Where are you going?</label>
                <input
                  id="destination"
                  type="text"
                  placeholder="Where are you going?"
                  className="headerSearchInput"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>
              <div className="headerSearchItem" ref={dateRef}>
                <FontAwesomeIcon icon={faCalendarDays} className="headerIcon" />
                <button type="button" onClick={() => setOpenDate(!openDate)} className="headerSearchText" aria-expanded={openDate}>
                  {`${format(dates[0].startDate, "dd MMM")} – ${format(dates[0].endDate, "dd MMM yyyy")}`}
                </button>
                {openDate && (
                  <DateRange
                    editableDateInputs={true}
                    onChange={(item) => setDates([item.selection])}
                    moveRangeOnFirstSelection={false}
                    ranges={dates}
                    className="date"
                    minDate={new Date()}
                  />
                )}
              </div>
              <div className="headerSearchItem" ref={optionsRef}>
                <FontAwesomeIcon icon={faPerson} className="headerIcon" />
                <button type="button" onClick={() => setOpenOptions(!openOptions)} className="headerSearchText" aria-expanded={openOptions}>
                  {`${options.adult} adult · ${options.children} children · ${options.room} room`}
                </button>
                {openOptions && (
                  <div className="options">
                    <Counter label="Adults" value={options.adult} min={1} onChange={(v) => setOption("adult", v)} />
                    <Counter label="Children" value={options.children} min={0} onChange={(v) => setOption("children", v)} />
                    <Counter label="Rooms" value={options.room} min={1} onChange={(v) => setOption("room", v)} />
                  </div>
                )}
              </div>
              <button type="submit" className="btn btn-primary headerSearchBtn">
                Search
              </button>
            </form>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
