import { useState } from "react";
import "./mailList.css";

const MailList = () => {
  const [sent, setSent] = useState(false);
  return (
    <section className="mail">
      <div className="container mailInner">
        <h2 className="mailTitle">Save time, save money!</h2>
        <p className="mailDesc">Sign up and we&apos;ll send the best deals to you.</p>
        {sent ? (
          <p className="mailNote" role="status">Thanks! The newsletter isn&apos;t live yet, so no emails will be sent.</p>
        ) : (
          <form className="mailInputContainer" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
            <label htmlFor="mail-email" className="visually-hidden">Email address</label>
            <input id="mail-email" type="email" required placeholder="Your email" />
            <button type="submit" className="btn btn-primary">Subscribe</button>
          </form>
        )}
      </div>
    </section>
  );
};

export default MailList;
