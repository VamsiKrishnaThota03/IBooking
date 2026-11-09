import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { useContext, useEffect, useState } from "react";
import { format } from "date-fns";
import "./reserve.css";
import useFetch from "../../hooks/useFetch";
import { SearchContext } from "../../context/SearchContext";
import { AuthContext } from "../../context/Authcontext";
import { apiRequest } from "../../api";
import { Empty, ErrorMessage, Loading } from "../status/Status";

// Every day from check-in up to (not including) check-out, as UTC-midnight timestamps.
const getDatesInRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const day = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
  const last = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  const dates = [];
  while (day.getTime() < last || dates.length === 0) {
    dates.push(day.getTime());
    day.setUTCDate(day.getUTCDate() + 1);
  }
  return dates;
};

const Reserve = ({ setOpen, hotelId }) => {
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const { data, loading, error, reFetch } = useFetch(`/hotels/room/${hotelId}`);
  const { dates } = useContext(SearchContext);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [setOpen]);

  const alldates = getDatesInRange(dates[0].startDate, dates[0].endDate);

  const isAvailable = (roomNumber) =>
    !roomNumber.unavailableDates.some((date) => alldates.includes(new Date(date).getTime()));

  const handleSelect = (e) => {
    const { checked, value } = e.target;
    setSelectedRooms(checked ? [...selectedRooms, value] : selectedRooms.filter((item) => item !== value));
  };

  const handleClick = async () => {
    setStatus({ state: "saving", message: "" });
    try {
      await Promise.all(
        selectedRooms.map((roomId) =>
          apiRequest(`/rooms/availability/${roomId}`, { method: "PUT", body: { dates: alldates }, token: user?.token })
        )
      );
      setStatus({ state: "done", message: "Your rooms are reserved. Enjoy your stay!" });
      setSelectedRooms([]);
      reFetch();
    } catch (err) {
      setStatus({ state: "error", message: err.message });
    }
  };

  return (
    <div className="reserve" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div className="rContainer" role="dialog" aria-modal="true" aria-labelledby="reserve-title">
        <button type="button" className="rClose" aria-label="Close" onClick={() => setOpen(false)}>
          <FontAwesomeIcon icon={faXmark} />
        </button>
        <h2 id="reserve-title" className="rHeading">Select your rooms</h2>
        <p className="rDates">
          {format(dates[0].startDate, "EEE dd MMM")} → {format(dates[0].endDate, "EEE dd MMM yyyy")}
        </p>

        {loading && <Loading label="Loading rooms…" />}
        {error && <ErrorMessage error={error} onRetry={reFetch} />}
        {!loading && !error && data.length === 0 && <Empty title="No rooms listed for this property yet" />}

        {!loading &&
          data.map((item) => (
            <div className="rItem" key={item._id}>
              <div className="rItemInfo">
                <div className="rTitle">{item.title}</div>
                <div className="rDesc">{item.desc}</div>
                <div className="rMax">
                  Sleeps up to <b>{item.maxPeople}</b>
                </div>
                <div className="rPrice">${item.price} / night</div>
              </div>
              <div className="rSelectRooms">
                {item.roomNumbers.map((roomNumber) => {
                  const available = isAvailable(roomNumber);
                  return (
                    <label className={`room ${available ? "" : "taken"}`} key={roomNumber._id} title={available ? "Available" : "Booked for these dates"}>
                      <input
                        type="checkbox"
                        value={roomNumber._id}
                        checked={selectedRooms.includes(roomNumber._id)}
                        onChange={handleSelect}
                        disabled={!available}
                      />
                      <span>{roomNumber.number}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

        {status.message && (
          <p className={`rStatus ${status.state === "error" ? "rStatusError" : ""}`} role="status">
            {status.message}
          </p>
        )}
        <button
          type="button"
          onClick={handleClick}
          className="btn btn-primary btn-block rButton"
          disabled={!selectedRooms.length || status.state === "saving"}
        >
          {status.state === "saving"
            ? "Reserving…"
            : selectedRooms.length
            ? `Reserve ${selectedRooms.length} room${selectedRooms.length > 1 ? "s" : ""}`
            : "Pick at least one room"}
        </button>
      </div>
    </div>
  );
};

export default Reserve;
