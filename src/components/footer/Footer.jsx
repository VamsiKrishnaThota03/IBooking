import "./footer.css";

const COLUMNS = [
  ["Countries", "Regions", "Cities", "Districts", "Airports", "Hotels"],
  ["Homes", "Apartments", "Resorts", "Villas", "Hostels", "Guest houses"],
  ["Unique places to stay", "Reviews", "Travel articles", "Seasonal deals"],
  ["Customer service", "Partner help", "Careers", "Terms & conditions"],
];

const Footer = () => (
  <footer className="footer">
    <div className="container">
      <div className="fLists">
        {COLUMNS.map((col, i) => (
          <ul className="fList" key={i}>
            {col.map((item) => (
              <li className="fListItem" key={item}>{item}</li>
            ))}
          </ul>
        ))}
      </div>
      <div className="fText">© {new Date().getFullYear()} IBooking · a learning project</div>
    </div>
  </footer>
);

export default Footer;
