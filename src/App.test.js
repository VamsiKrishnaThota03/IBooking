import { render, screen } from "@testing-library/react";
import App from "./App";
import { AuthContextProvider } from "./context/Authcontext";
import { SearchContextProvider } from "./context/SearchContext";

beforeEach(() => {
  global.fetch = jest.fn(() => new Promise(() => {}));
});

test("renders the home page with the search bar", () => {
  render(
    <AuthContextProvider>
      <SearchContextProvider>
        <App />
      </SearchContextProvider>
    </AuthContextProvider>
  );
  expect(screen.getAllByText(/IBooking/i).length).toBeGreaterThan(0);
  expect(screen.getByLabelText(/where are you going/i)).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/hotels"), expect.anything());
});
