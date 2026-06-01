import PropTypes from 'prop-types';
import careSitterImage from '../images/care-sitter-with-dog.jpg';
import hamsterImage from '../images/hamster.jpg';
import plantsCareImage from '../images/planst-care.webp';
import safePlantsImage from '../images/Post-safe-houseplants-for-pets.jpg';

const ABOUT_GALLERY = [
  {
    src: careSitterImage,
    alt: 'Caregiver walking a happy dog outdoors',
    caption: 'Trusted sitters',
  },
  {
    src: hamsterImage,
    alt: 'Small pet receiving gentle care',
    caption: 'Every pet matters',
  },
  {
    src: plantsCareImage,
    alt: 'Healthy indoor plants in a bright home',
    caption: 'Plant care',
  },
  {
    src: safePlantsImage,
    alt: 'Houseplants kept safe alongside pets',
    caption: 'Home harmony',
  },
];

export default function AboutPage({ onBackHome }) {
  return (
    <article className="status-card about-page-card">
      <header className="about-header">
        <button type="button" className="about-back-link" onClick={onBackHome}>
          ← Home
        </button>
      </header>

      <section className="about-intro">
        <span className="about-eyebrow">About us</span>
        <h1>Care for pets and plants, made simple.</h1>
        <p className="about-text">
          PetCare connects owners with trusted sitters through a calm, secure booking experience—whether you are away
          for a weekend or need ongoing help at home.
        </p>
      </section>

      <section className="about-gallery" aria-label="PetCare community">
        {ABOUT_GALLERY.map((item) => (
          <figure key={item.caption} className="about-gallery-item">
            <img src={item.src} alt={item.alt} loading="lazy" />
            <figcaption>{item.caption}</figcaption>
          </figure>
        ))}
      </section>

      <div className="about-pillars">
        <article className="about-pillar">
          <span className="about-pillar-label">Mission</span>
          <p>
            Connect every owner with reliable caregivers through a platform that is clear, secure, and easy to use.
          </p>
        </article>
        <article className="about-pillar">
          <span className="about-pillar-label">Vision</span>
          <p>
            Build the most trusted community for homes with pets and plants—where care is thoughtful and accessible to
            all.
          </p>
        </article>
      </div>

      <div className="about-tags" aria-label="Our values">
        <span>Trust</span>
        <span>Flexibility</span>
        <span>Community</span>
      </div>
    </article>
  );
}

AboutPage.propTypes = {
  onBackHome: PropTypes.func.isRequired,
};
