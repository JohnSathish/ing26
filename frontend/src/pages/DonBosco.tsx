import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import './DonBosco.css';

function DonBosco() {
  return (
    <div className="don-bosco-page">
      <Header />
      <div className="don-bosco-content-container">
        <h1>Don Bosco</h1>
        <div className="content">
          <p>Content about Don Bosco will be displayed here.</p>
          <p>This page can be managed through the admin panel or settings.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default DonBosco;

