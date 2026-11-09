import { createContext, useReducer } from "react";

const today = new Date();
today.setHours(0, 0, 0, 0);
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);

export const DEFAULT_SEARCH = {
  destination: "",
  dates: [{ startDate: today, endDate: tomorrow, key: "selection" }],
  options: { adult: 1, children: 0, room: 1 },
};

export const SearchContext = createContext(DEFAULT_SEARCH);

const SearchReducer = (state, action) => {
  switch (action.type) {
    case "NEW_SEARCH":
      return { ...state, ...action.payload };
    case "RESET_SEARCH":
      return DEFAULT_SEARCH;
    default:
      return state;
  }
};

export const SearchContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(SearchReducer, DEFAULT_SEARCH);
  return (
    <SearchContext.Provider value={{ ...state, dispatch }}>{children}</SearchContext.Provider>
  );
};

// Number of nights between two dates (at least 1).
export const nightsBetween = (start, end) =>
  Math.max(1, Math.round((new Date(end).setHours(0, 0, 0, 0) - new Date(start).setHours(0, 0, 0, 0)) / 86400000));
