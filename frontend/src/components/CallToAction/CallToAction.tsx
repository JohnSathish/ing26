import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import './CallToAction.css';

function CallToAction() {
  return (
    <section className="call-to-action">
      <div className="container">
        <div className="cta-content">
          <h2 className="cta-title">Join Us in Our Mission</h2>
          <p className="cta-description">
            Be part of our journey to serve the youth and make a positive impact in Northeast India.
            Together, we can build a better future.
          </p>
          <div className="cta-buttons">
            <Link to={ROUTES.ABOUT_US} className="cta-button cta-primary">
              Learn More
            </Link>
            <a href="#footer" className="cta-button cta-secondary">
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CallToAction;

