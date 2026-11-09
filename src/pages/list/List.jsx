import "./list.css";
import Navbar from "../../components/navbar/Navbar";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import { useLocation } from "react-router-dom";
import { useContext, useState } from "react";
import { format } from "date-fns";
import { DateRange } from "react-date-range";
import SearchItem from "../../components/searchItem/SearchItem";
import useFetch from "../../hooks/useFetch";
import { SearchContext } from "../../context/SearchContext";
import { Empty, ErrorMessage, Loading } from "../../components/status/Status";

const buildQuery = ({ destination, min, max }) => {
  const params = new URLSearchParams();
  if (destination) params.set("city", destination);
  if (min) params.set("min", min);
  if (max) params.set("max", max);
  return `/hotels?${params.toString()}`;
};

const List = () => {
  const location = useLocation();
  const search = useContext(SearchContext);
  const initial = location.state || search;
  const [destination, setDestination] = useState(initial.destination || "");
  const [dates, setDates] = useState(initial.dates || search.dates);
  const [openDate, setOpenDate] = useState(false);
  const [options, setOptions] = useState(initial.options || search.options);
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [query, setQuery] = useState(buildQuery({ destination: initial.destination }));

  const { data, loading, error, reFetch } = useFetch(query);

  const handleSearch = (e) => {
    e.preventDefault();
    search.dispatch({ type: "NEW_SEARCH", payload: { destination, dates, options } });
    const next = buildQuery({ destination: destination.trim(), min, max });
    if (next === query) reFetch();
    else setQuery(next);
  };

  const setOption = (name) => (e) => setOptions({ ...options, [name]: Math.max(0, parseInt(e.target.value, 10) || 0) });

  return (
    <div className="listPage">
      <Navbar />
      <Header type="list" />
      <main className="listContainer container">
        <form className="listSearch" onSubmit={handleSearch}>
          <h1 className="lsTitle">Search</h1>
          <div className="lsItem">
            <label htmlFor="ls-destination">Destination</label>
            <input id="ls-destination" type="text" placeholder="Any city" value={destination} onChange={(e) => setDestination(e.target.value)} />
          </div>
          <div className="lsItem">
            <label htmlFor="ls-dates">Check-in / check-out</label>
            <button id="ls-dates" type="button" className="lsDates" onClick={() => setOpenDate(!openDate)} aria-expanded={openDate}>
              {`${format(dates[0].startDate, "dd MMM")} – ${format(dates[0].endDate, "dd MMM yyyy")}`}
            </button>
            {openDate && (
              <DateRange onChange={(item) => setDates([item.selection])} minDate={new Date()} ranges={dates} className="lsCalendar" />
            )}
          </div>
          <fieldset className="lsOptions">
            <legend>Options</legend>
            <label className="lsOptionItem">
              <span>Min price <small>per night</small></span>
              <input type="number" min={0} value={min} onChange={(e) => setMin(e.target.value)} className="lsOptionInput" />
            </label>
            <label className="lsOptionItem">
              <span>Max price <small>per night</small></span>
              <input type="number" min={0} value={max} onChange={(e) => setMax(e.target.value)} className="lsOptionInput" />
            </label>
            <label className="lsOptionItem">
              <span>Adults</span>
              <input type="number" min={1} value={options.adult} onChange={setOption("adult")} className="lsOptionInput" />
            </label>
            <label className="lsOptionItem">
              <span>Children</span>
              <input type="number" min={0} value={options.children} onChange={setOption("children")} className="lsOptionInput" />
            </label>
            <label className="lsOptionItem">
              <span>Rooms</span>
              <input type="number" min={1} value={options.room} onChange={setOption("room")} className="lsOptionInput" />
            </label>
          </fieldset>
          <button type="submit" className="btn btn-primary btn-block">Search</button>
        </form>
        <section className="listResult" aria-live="polite">
          {loading && <Loading label="Finding stays…" />}
          {error && <ErrorMessage error={error} onRetry={reFetch} />}
          {!loading && !error && (
            <>
              <p className="listCount">
                {data.length} {data.length === 1 ? "property" : "properties"} found
                {destination.trim() ? ` in ${destination.trim()}` : ""}
              </p>
              {data.length === 0 ? (
                <Empty title="No stays match your search">Try another city or widen the price range.</Empty>
              ) : (
                data.map((item) => <SearchItem item={item} key={item._id} />)
              )}
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default List;
