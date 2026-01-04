import { useEffect, useState } from 'react';
import { apiGet } from '../../services/api';
import { API_ENDPOINTS, ROUTES } from '../../utils/constants';
import './Welcome.css';

const DEFAULT_CONTENT = `The birth of the Province of Guwahati in 1959 from the Mother Province of North India was both timely and momentous. It was the tangible sign from above of the divine sanction that accompanied at every step the heroic feast of the Salesian pioneers who engendered the Assam Mission miracle. On 21st July, 1921, Fr. Paul Albera, Rector Major of the Salesians, acceding to the repeated request of Propaganda Fide, accepted the Assam Mission, reiterating St. Peter's words to Christ, In verbo autem tuo laxabo rete (at your words I will let down the net, Luke 5:5). It was the beginning of a glorious chapter in the history of the Indian Missions, that is replete with missionary adventures and achievements which deserve to be written in letters of gold. True to the prophetic words of the Rector Major, his missionary sons braved innumerable obstacles and dangers to "launch into the deep."

Although the Province of Guwahati as such was only established in 1959, its history is inseparably linked with the beginning and growth of the Catholic Church and the Salesian Mission in North-East India or "Assam," as it was known earlier. Assam was established as a new Prefecture in 1889 and it was entrusted to the Society of Divine Saviour (Salvatorians). In 1915 the Salvatorians were expelled from Assam due to World War I, following which the Belgian Jesuits from Calcutta assumed temporary care of the Mission at the departure of the German Salvatorians.

When it became evident that the Salvatorians could not return to Assam after the war, Propaganda Fide approached several religious Congregations to take up the Assam Mission. But none of them responded positively. From 1918, Propaganda Fide turned its attention to the Salesian congregation for the care of the Assam Mission. On 6th July, 1920, Fr. Albera wrote to the Prefect of Propaganda Fide conveying the inability of the Salesians to oblige them for several valid reasons. In spite of the refusal from the part of the Rector Major of the Salesians, the Prefect of Propaganda Fide subsequently made the same request not less than five times. It was on 21st July, 1921, that Fr. Albera officially responded to them conveying his willingness to accept the Assam Mission.

The Rector Major presented to Fr. Louis Mathias, the leader of the pioneering team, the list of Salesians who would form the pioneer group to Assam. The list consisted only of six priests. At the request of Fr. Mathias, five brothers were added to the group. At the solemn ceremony of the departure of the missionaries on 23rd October, 1921, in the Basilica of Mary Help of Christians, Turin, Fr. Mathias described the new mission land as a New Patagonia and the New Promised Land where he said that the Salesians will speak the language of the Lord and will repeat the prodigy of the first Pentecost. On 20th December, 1921, the group celebrated Holy Mass in the little room of Don Bosco at Valdocco and started their long journey to Assam.

On 6th January, 1922, the pioneering team reached Bombay, and 9th January reached Calcutta. On 11th January, they left Calcutta and boarded the train to Guwahati. And finally on 13th January 1922, they reached Shillong.

The leader of the pioneering group, Fr Louis Mathias, with his motto "Dare and Hope" and his ten valiant companions, have initiated an unprecedented missionary activity in the North East which continues even today. At present there are three Provinces in the North East: Guwahati (1959), Dimapur (1981), and Shillong (2012): all of them equally missionary. Thanks to the early missionaries who dared and hoped, and it is their enthusiasm and inspiration that we have been able to emulate in our own limited ways.

OUR IDENTITY

We the Salesians of Don Bosco live in communities that are actively engaged in the world of youth. We are members of the Church and work in harmony with its teachings. Prayer and obedience to the Spirit of God are the foundation of our service. We strive to make Don Bosco's dream a reality and to inculcate his unique style and charism. We live out our consecration to God through the three vows: poverty, chastity and obedience.

Our pledge to young people is to deepen our credibility as 'signs and bearers of God's love' to each of them. Our preferential option is to work among the poor and abandoned youth of society. Becoming 'signs and bearers of God's love' is our path to holiness – a journey each of us has chosen to make with the young! Don Bosco, drawing his inspiration from the zeal and goodness of St. Francis de Sales, gave us the name 'Salesians'. We are recognized in the Catholic Church, since 1st March 1869, as a clerical religious institute of pontifical right, dedicated to apostolic works.

Our Mission: Education and evangelization are at the centre of our mission. The pastoral-educative service that we want to carry out is directed to the integral development of the person. The first and principal beneficiaries of our mission are the young, especially the poorest of them, young workers and those preparing themselves for work, and apostolic vocations; in view of these we work amongst the common folk with special attention to lay evangelizers, family, social communication, and those not yet evangelized.

The activities and works by means of which we Salesians carry out our mission, depend on the needs and situations of the people whom we serve. We carry out activities and works in which it is possible to promote the human and Christian education of the young:

1. The Oratory and Youth Centre: An environment of broad acceptance, open to a wide range of young people, above all those most alienated. This is achieved through a diversity of educational and evangelizing activities characterized by their focus on the young and strong personal relationships between educator and youngster, capable of becoming a missionary presence in the world of the young and of civil society.

2. The school and Professional formation: Centres for formal education, inspired by Gospel values according to the spirit and pedagogical style of the Salesians, in order to promote popular education attentive to the most needy, to their professional formation and to accompanying their gradual insertion into the world of work.

3. Boarding and hostel arrangements: A service for accepting young people without family or who are temporarily estranged from family. Here they find personal relationships, opportunity for commitment and responsibility for young people in daily life, and the life of the group with its various formative educative and Christian opportunities.

4. A presence to the Tertiary sector: Through institutes of higher education inspired by Christian values and with a Catholic and Salesian style; hostels and university residences, other services of pastoral animation at this level.

5. The parish: Characterized by a special attention to young people, above all to the poorest of them, the popular environment where it is to be found, by the presence of a Salesian religious community at its animating heart, and by activity of evangelization and education to faith strictly integrated with the human development of the person and the group.

6. Social services and works for youth-at-risk: A family atmosphere of acceptance and education, animated by a community with 'preventive' criteria according to the educative style of Don Bosco. This is inspired by the Gospel and has the aim to evangelize, open to the transformation of realities which are socially exclusive and to the building of a culture of solidarity, in collaboration with other social institutions.

7. Social communication: Through education to an understanding and proper use and utilization of the media, the development of the communicative potential of persons through the new languages of music, theatre, art etc. Formation to a critical, aesthetic and moral sense, promotion of information and editorial centres in press, radio, television, internet etc. Finally, the service of the Salesian educational and pastoral project.

8. Other new forms of Salesian presence to the young: The Salesian Youth Movement, the Salesian Voluntariate, services for vocational orientation, specialized services for Christian formation, and more.

TIME LINE

1922 – The state of Assam (the present NE India with its seven states of Assam, Meghalaya, Arunachal Pradesh, Nagaland, Manipur, Mizoram and Tripura) was entrusted to the Salesians of Don Bosco. The first band of Salesian missionaries, led by Fr. Louis Mathias reached Shillong on January 1922. The Catholic population of NE India at that time was less than 5000.

1926 – The first province of Salesian India – the province of Calcutta with Fr. Louis Mathias as the first provincial – is canonically erected.

1932 – The diocese of Shillong (for the entire NE India) is established with Msgr. Louis Mathias as its first Bishop, while Msgr. Stephen Ferrando is appointed as the bishop of Krishnagar.

1935 – Msgr. Stephen Ferrando is appointed as the second bishop of Shillong on the transfer of Msgr. Louis Mathias to Madras-Mylapore.

1951 – Fr. Orestes Marengo is ordained as the first bishop of the second diocese of NE India, Dibrugarh, which is carved out from the diocese of Shillong.

1959 – The Province of Guwahati for Northeast India is erected with Fr. Anthony Alessi as its first provincial.

1964 – Msgr. Orestes Marengo of Dibrugarh is transferred to Tezpur, bifurcated from the diocese of Shillong, as its first bishop. Fr. Hubert D'Rosario is appointed as the second bishop of Dibrugarh.

1969 – Shillong is raised to the status of a Metropolitan See. Msgr. Stephen Ferrando retires. Msgr. Hubert D'Rosario, bishop of Dibrugarh, is transferred to Shillong as its first Archbishop. Msgr. Robert Kerketta is nominated as the third bishop of Dibrugarh.

1973 – Msgr. Orestes Marengo is appointed as the Apostolic Administrator of the new diocese Tura, bifurcated from the Shillong Archdiocese. Its first bishop will be Msgr. George Mamalassery, a diocesan priest, ordained as bishop in 1979.

1973 – Fr. Abraham Alangimattathil is ordained as the first bishop of the new diocese of Kohima-Imphal, a region formerly under Dibrugarh.

1981 – Fr. Thomas Menamparampil is ordained as the fourth Bishop of Dibrugarh.

1982 – The Province of Guwahati is divided to form a new province of Dimapur with Nagaland, Manipur, Upper Assam and Arunachal forming its territory. Fr. Mathew Pulingathil is its first provincial.

1984 – Fr. Mathai Kochuparambil is ordained as the first bishop of the new diocese Diphu, bifurcated from the diocese of Shillong.

1990 – Msgr. Tarcisius Resto is appointed as the auxiliary bishop of Shillong.

1992 – Msgr. Thomas Menamparampil sdb is appointed as the first bishop of the new diocese of Guwahati, carved out from the diocese of Shillong, Tezpur and Tura. He is appointed as its first Archbishop in 1995. Fr. Joseph Aind is ordained as the fifth bishop of Dibrugarh.

1995 – Msgr. Tarcisius Resto takes over as the second Archbishop of Shillong.

2000 – Fr. Dominic Jala is ordained as the third Archbishop of Shillong.

2002 – Eighty years since the arrival of the Salesians in Northeast India. Through the hard work of the pioneering missionaries and their followers, the Church in the region has witnessed an unprecedented growth. From a prefecture apostolic in 1922, there are now three Archdioceses, and 8 dioceses. The congregation has given to the Church in Northeast India 10 bishops.

2009 – Golden Jubilee Year of the Missionary province of Guwahati. The Rector Major of the Salesians, Rev. Fr. Pascual V. Chavez visits the province and participates in the Golden Jubilee celebrations.

2011 – The province is divided in to two. The province of Silchar is born out of the Guwahati province.`;

const EXCERPT_LENGTH = 1000; // Show more content initially to utilize available space

function Welcome() {
  const [provinceImage, setProvinceImage] = useState<string | null>(null);
  const [provinceContent, setProvinceContent] = useState<string>(DEFAULT_CONTENT);

  useEffect(() => {
    // Fetch province image and content from settings
    apiGet<{ success: boolean; data: { [key: string]: string } }>(API_ENDPOINTS.SETTINGS.GET)
      .then((response) => {
        console.log('Settings API response:', response);
        if (response.success && response.data) {
          console.log('All settings keys:', Object.keys(response.data));
          
          // Get province image
          const image = response.data['province_image'] || response.data['province_image_url'] || null;
          console.log('Province image from settings:', image);
          
          if (image) {
            // Ensure image URL is properly formatted
            let imageUrl = image.trim();
            if (imageUrl.startsWith('uploads/') || imageUrl.startsWith('/uploads/')) {
              imageUrl = imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl;
            } else if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://') && !imageUrl.startsWith('/')) {
              imageUrl = '/uploads/images/' + imageUrl;
            }
            console.log('Formatted province image URL:', imageUrl);
            setProvinceImage(imageUrl);
          } else {
            console.log('No province_image found in settings. Available keys:', Object.keys(response.data));
          }
          
          // Get province content/message
          const content = response.data['province_message'] || response.data['province_content'] || null;
          if (content) {
            setProvinceContent(content);
          }
        }
      })
      .catch((error) => {
        console.error('Failed to fetch province settings:', error);
      });
  }, []);

  const formatContent = (text: string, includeReadMore: boolean = false): string => {
    // If we need to truncate, find "gold" and truncate there
    let displayText = text;
    if (includeReadMore) {
      // Find the position of "gold" (case insensitive)
      const goldIndex = text.toLowerCase().indexOf('gold');
      if (goldIndex !== -1) {
        // Find the end of the sentence containing "gold"
        const sentenceEnd = text.indexOf('.', goldIndex);
        if (sentenceEnd !== -1) {
          displayText = text.substring(0, sentenceEnd + 1).trim();
        } else {
          // If no period after gold, just truncate at gold + a few words
          const wordsAfterGold = text.substring(goldIndex).split(' ');
          if (wordsAfterGold.length > 1) {
            const truncateAt = goldIndex + wordsAfterGold[0].length + 1; // Include "gold" and space
            displayText = text.substring(0, truncateAt).trim();
          } else {
            displayText = text.substring(0, goldIndex + 4).trim(); // Just "gold"
          }
        }
      }
    }
    
    // Split by double newlines (paragraph breaks)
    const paragraphs = displayText
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
    
    let html = '';
    paragraphs.forEach(para => {
      // Check if it's a section heading (all caps or starts with number)
      if (para.match(/^[A-Z\s]+$/) && para.length < 50 && !para.includes('.')) {
        html += `<h3 class="content-section-title">${escapeHtml(para)}</h3>`;
      } else if (para.match(/^\d{4}\s*–/)) {
        // Timeline entry
        html += `<p class="timeline-entry">${escapeHtml(para)}</p>`;
      } else if (para.match(/^\d+\.\s/)) {
        // Numbered list item
        html += `<p class="numbered-item">${escapeHtml(para)}</p>`;
      } else {
        html += `<p>${escapeHtml(para)}</p>`;
      }
    });
    
    // Add Read More link at the end if needed
    if (includeReadMore && text.length > EXCERPT_LENGTH) {
      // Find the last </p> tag and add Read More before it
      html = html.replace(/(<\/p>)([^<]*)$/, `... <a href="${ROUTES.PROVINCE}" class="read-more-link">Read More</a></p>`);
    }
    
    return html;
  };

  const escapeHtml = (text: string): string => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const needsExpansion = provinceContent.length > EXCERPT_LENGTH;

  return (
    <section className="welcome">
      <div className="container">
        <h2 className="section-title">Welcome to 'Province of Mary Help of Christians ING: Guwahati'</h2>
        <div className="welcome-content">
          <div className="welcome-image">
            {provinceImage ? (
              <img 
                src={provinceImage} 
                alt="Province of Mary Help of Christians" 
                className="province-image"
                onError={(e) => {
                  console.error('Failed to load province image. URL:', provinceImage);
                  console.error('Image error details:', e);
                  const target = e.target as HTMLImageElement;
                  // Don't hide, show error message
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="image-placeholder" style="padding: 2rem;">
                        <p>Province Image</p>
                        <p style="font-size: 0.875rem; margin-top: 0.5rem; color: #dc2626;">
                          Image failed to load: ${provinceImage}
                        </p>
                        <p style="font-size: 0.875rem; margin-top: 0.5rem; color: #9ca3af;">
                          Check if the image exists at: public_html${provinceImage}
                        </p>
                      </div>
                    `;
                  }
                }}
                onLoad={() => {
                  console.log('✓ Province image loaded successfully:', provinceImage);
                }}
              />
            ) : (
              <div className="image-placeholder">
                <p>Province Image</p>
                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: '#9ca3af' }}>
                  Upload image via Admin → Settings
                </p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#9ca3af', fontStyle: 'italic' }}>
                  Or set province_image setting in database
                </p>
              </div>
            )}
          </div>
          <div className="welcome-text">
            <div 
              className="welcome-content-text"
              dangerouslySetInnerHTML={{ __html: formatContent(provinceContent, needsExpansion) }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Welcome;


