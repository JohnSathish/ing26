import './RectorMajor.css';

function RectorMajor() {
  return (
    <section className="rector-major">
      <div className="container">
        <h2 className="section-title">RECTOR MAJOR AND HIS COUNCIL</h2>
        <div className="rector-content">
          <div className="rector-council-image">
            <img 
              src="/rector-major-council.jpg" 
              alt="Rector Major and His Council" 
              onError={(e) => {
                console.error('Failed to load council image');
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div className="rector-text-section">
            <div className="rector-profile-container">
              <div className="rector-profile-image">
                <img 
                  src="/rector-major-photo.jpg" 
                  alt="Rector Major" 
                  onError={(e) => {
                    console.error('Failed to load profile image');
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <h3 className="rector-name">Rev Fr. Fabio ATTARD</h3>
            </div>
            <div className="rector-text">
              <p>
                The Rector Major and his Council represent the highest authority in the Salesian Congregation. 
                They guide and lead the Salesian Family worldwide, ensuring the charism and mission of Don Bosco 
                continue to inspire and serve young people across the globe.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default RectorMajor;


