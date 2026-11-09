import Featured from "../../components/featured/Featured";
import FeaturedProperties from "../../components/featuredProperties/FeaturedProperties";
import Footer from "../../components/footer/Footer";
import Header from "../../components/header/Header";
import MailList from "../../components/mailList/MailList";
import Navbar from "../../components/navbar/Navbar";
import PropertyList from "../../components/propertyList/PropertyList";
import "./home.css";

const Home = () => (
  <div>
    <Navbar />
    <Header />
    <main className="homeContainer container">
      <section>
        <h2 className="section-title">Trending destinations</h2>
        <p className="section-sub">Popular cities with travellers right now.</p>
        <Featured />
      </section>
      <section>
        <h2 className="section-title">Browse by property type</h2>
        <p className="section-sub">From city hotels to cabins in the woods.</p>
        <PropertyList />
      </section>
      <section>
        <h2 className="section-title">Homes guests love</h2>
        <p className="section-sub">Our featured, highly rated stays.</p>
        <FeaturedProperties />
      </section>
    </main>
    <MailList />
    <Footer />
  </div>
);

export default Home;
