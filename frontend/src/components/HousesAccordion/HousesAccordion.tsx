import { useState } from 'react';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';
import './HousesAccordion.css';

interface House {
  name: string;
  year?: string;
  status?: string;
  note?: string;
  content?: string; // HTML content for the house details
}

interface HousesAccordionProps {
  houses: House[];
  dioceseName?: string;
}

function HousesAccordion({ houses, dioceseName }: HousesAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleHouse = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (!houses || houses.length === 0) {
    return null;
  }

  return (
    <div className="houses-accordion">
      <h2 className="houses-accordion-title">
        {dioceseName ? `Houses in ${dioceseName}` : 'Our Houses'}
      </h2>
      <div className="houses-accordion-list">
        {houses.map((house, index) => (
          <div 
            key={index} 
            className={`house-accordion-item ${openIndex === index ? 'open' : ''}`}
          >
            <button
              className="house-accordion-header"
              onClick={() => toggleHouse(index)}
              aria-expanded={openIndex === index}
            >
              <div className="house-accordion-header-content">
                <span className="house-accordion-name">{house.name}</span>
                {(house.year || house.status) && (
                  <span className="house-accordion-meta">
                    {house.year && <span className="house-year">{house.year}</span>}
                    {house.status && <span className="house-status">{house.status}</span>}
                  </span>
                )}
              </div>
              {openIndex === index ? (
                <FaChevronDown className="house-accordion-icon" />
              ) : (
                <FaChevronRight className="house-accordion-icon" />
              )}
            </button>
            {openIndex === index && (
              <div className="house-accordion-content">
                {house.note && (
                  <p className="house-accordion-note">{house.note}</p>
                )}
                <div className="house-accordion-details">
                  {house.content ? (
                    <div 
                      className="house-accordion-content-html"
                      dangerouslySetInnerHTML={{ __html: house.content }}
                    />
                  ) : (
                    <p className="house-accordion-description">
                      {house.name} is one of the houses in {dioceseName || 'this diocese'}.
                      {house.year && ` Established in ${house.year}.`}
                      {house.status && ` Status: ${house.status}.`}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default HousesAccordion;

