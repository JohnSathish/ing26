import Header from '../components/Header/Header';
import Hero from '../components/Hero/Hero';
// import Statistics from '../components/Statistics/Statistics';
import Welcome from '../components/Welcome/Welcome';
import ProvincialMessage from '../components/ProvincialMessage/ProvincialMessage';
import BirthdayWishes from '../components/BirthdayWishes/BirthdayWishes';
import Strenna from '../components/Strenna/Strenna';
import RectorMajor from '../components/RectorMajor/RectorMajor';
import Houses from '../components/Houses/Houses';
import News from '../components/News/News';
import Collaborations from '../components/Collaborations/Collaborations';
import QuickLinks from '../components/QuickLinks/QuickLinks';
import CallToAction from '../components/CallToAction/CallToAction';
import Footer from '../components/Footer/Footer';
import './Home.css';

function Home() {
  return (
    <div className="home">
      <Header />
      <Hero />
      {/* <Statistics /> */}
      <Welcome />
      <ProvincialMessage />
      <BirthdayWishes />
      <Strenna />
      <RectorMajor />
      <Houses />
      <News />
      <Collaborations />
      <QuickLinks />
      <CallToAction />
      <Footer />
    </div>
  );
}

export default Home;

