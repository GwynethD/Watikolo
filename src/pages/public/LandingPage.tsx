import { Link } from 'react-router-dom';
import { HeroSection } from '@/components/common/HeroSection';

export function LandingPage() {
  const featureImage = new URL('../../pictures/watikolo-main.png', import.meta.url).href;
  const servicesImage = new URL('../../pictures/watikolo-home.png', import.meta.url).href;
  const accommodationImage = new URL('../../pictures/watikolo-function.png', import.meta.url).href;
  const poolImage = new URL('../../pictures/watikolo-lpool.png', import.meta.url).href;
  const roomImage = new URL('../../pictures/room1.jpg', import.meta.url).href;
  const room2Image = new URL('../../pictures/room2.jpg', import.meta.url).href; 
  const room3Image = new URL('../../pictures/room3.jpg', import.meta.url).href;
  return (
    <div className="bg-white font-body">
      <HeroSection />

      <div className="h-[5px]" />

      <section id="about" className="py-10">
        <div className="mx-auto max-w-6xl px-6">
          <h1 className="font-display text-2xl font-semibold text-[#1f1f1f]">
            Watikolo Event Venue - The Perfect Place for Life's Finest Celebrations
          </h1>

          <div className="mt-5 space-y-4 leading-relaxed text-gray-600">
            <p>
             Watikolo Event Venue Rental, located in Purok 4 Upper Puntod Road,Tabalong, Dauis, Bohol, is a charming and exclusive event space designed to host life's most meaningful celebrations. A private destination where unforgettable moments come to life, inspired by elegance, warmth, and the joy of gathering together.
            </p>

            <p>
             With the comfort of a thoughtfully designed venue, the beauty of a serene and intimate setting, and a dedicated team ready to assist you - families, friends, and colleagues can celebrate with ease and confidence. From birthdays and corporate gatherings to weddings and special milestones, Watikolo offers the perfect space to create lasting memories.
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-2xl border shadow-card">
            <iframe
              className="h-[500px] w-full"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              title="Watikolo Video"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      <section id="gallery" className="py-1">
        <div className="mx-auto max-w-6xl px-6">
          <div className="overflow-hidden rounded-2xl border shadow-card">
            <img src={featureImage} alt="Watikolo Event Venue" className="w-full object-cover" />
          </div>
        </div>
      </section>

      <section className="py-6">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-2xl font-semibold text-[#1f1f1f]">Location </h2>

          <div className="mt-3 space-y-3 leading-relaxed text-gray-600">
            <p>
              Nestled in a quiet, all-natural setting in Dauis, Bohol, Watikolo Event Venue offers a peaceful and private
              environment. Its serene location makes it perfect for meaningful gatherings, special milestones, and memorable
              events.
            </p>
            <p>
              The venue is easily accessible from Tagbilaran City, Panglao Island, and other key areas in Bohol, making it a
              convenient choice for both local and out-of-town guests. Whether you&apos;re celebrating a birthday, wedding,
              corporate event, or family reunion, Watikolo provides a tranquil escape where you can create unforgettable
              memories with your loved ones.
            </p>
          </div>
        </div>
      </section>

      <section id="things-to-do" className="py-6">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-2xl font-semibold text-[#1f1f1f]">Services and Facilities</h2>

          <p className="mt-3 text-gray-600">
            At Watikolo Event Venue Rental, we offer a complete and comfortable setting designed to make every celebration
            seamless, enjoyable, and unforgettable.
          </p>

          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-2 font-semibold text-[#1f1f1f]">Venue Facilities</h3>

              <ul className="space-y-2 text-gray-600">
                <li>- Expansive 6,000+ sqm property</li>
                <li>- Exclusive private venue use</li>
                <li>- Swimming pool area</li>
                <li>- Fully furnished bedrooms</li>
                <li>- Indoor parking</li>
                <li>- Kitchen and grill area</li>
                <li>- Billiard table</li>
              </ul>
            </div>

            <div>
              <h3 className="mb-2 font-semibold text-[#1f1f1f]">Event Services</h3>

              <ul className="space-y-2 text-gray-600">
                <li>- Flexible venue layout</li>
                <li>- On-site staff assistance</li>
                <li>- Open event spaces</li>
                <li>- Perfect for different event celebrations</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-4">
        <div className="mx-auto max-w-6xl px-6">
          <div className="overflow-hidden rounded-2xl border shadow-card">
            <img src={servicesImage} alt="Watikolo Facilities" className="w-full object-cover" />
          </div>

          <p className="mt-3 text-gray-600">
            At Watikolo Event Venue Rental, we offer a complete and comfortable setting designed to make every celebration
            seamless, enjoyable, and unforgettable.
          </p>
        </div>
      </section>

      <section id="accommodations" className="py-6">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-2xl font-semibold text-[#1f1f1f]">Accommodations</h2>

          <div className="mt-3 space-y-3 leading-relaxed text-gray-600">
            <p>
              Within the spacious grounds of Watikolo Event Venue Rental, guests can enjoy comfortable on-site
              accommodations designed to suit different group sizes and event needs. Whether for intimate gatherings or
              larger celebrations, our flexible room arrangements allow guests to stay conveniently within the venue.
            </p>

            <p>
              The property features three fully furnished bedrooms - two located upstairs and one on the ground floor - ideal
              for families, bridal parties, event organizers, or groups who wish to extend their stay. Guests also have access
              to the venue&apos;s amenities, including the L-shaped swimming pool, kitchen and grill area, and indoor entertainment
              spaces, ensuring both comfort and enjoyment throughout their visit.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border shadow-card">
              <img src={accommodationImage} alt="Watikolo Accommodations" className="w-full object-cover" />
            </div>

            <div className="overflow-hidden rounded-2xl border shadow-card">
              <img src={poolImage} alt="Watikolo Pool" className="w-full object-cover" />
            </div>
          </div>

          <p className="mt-3 leading-relaxed text-gray-600">
            For exclusive bookings, the entire compound offers expansive open grounds with flexible event space, allowing you
            to host gatherings of various sizes. Whether for birthdays, wedding receptions, reunions, corporate outings, or
            private celebrations, Watikolo can accommodate large groups comfortably, depending on your event setup and
            requirements.
          </p>
        </div>
      </section>

      <section className="pb-10 pt-4">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-2xl font-semibold text-[#1f1f1f]">Book Your Venue</h2>

          <p className="mt-2 text-gray-600">Spacious. Private. Perfect for Every Occasion.</p>

          <div className="mt-6 grid items-stretch gap-6 md:grid-cols-3">
            <div className="flex h-full flex-col overflow-hidden rounded-xl shadow-md">
              <img src={featureImage} alt="Essential package" className="h-52 w-full object-cover" />

              <div className="flex flex-1 bg-[#0f4da0] p-4">
                <div className="w-full bg-[#dbe3ee] p-4 text-sm text-gray-800">
                  <p className="mb-2 font-semibold">ESSENTIAL PACKAGE - PHP 5,000.00</p>

                  <ul className="space-y-1">
                    <li>- Maximum of 30 PAX</li>
                    <li>- 8 Hours Venue Day Use</li>
                    <li>- 5 Hours Venue Night Use</li>
                    <li>- Pool Access</li>
                    <li>- Billiard Table</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex h-full flex-col overflow-hidden rounded-xl shadow-md">
              <img src={servicesImage} alt="Classic package" className="h-52 w-full object-cover" />

              <div className="flex flex-1 bg-[#0f4da0] p-4">
                <div className="w-full bg-[#dbe3ee] p-4 text-sm text-gray-800">
                  <p className="mb-2 font-semibold">CLASSIC PACKAGE - PHP 10,000.00</p>

                  <ul className="space-y-1">
                    <li>- Maximum of 120 PAX</li>
                    <li>- 8 Hours Venue Day Use</li>
                    <li>- 5 Hours Venue Night Use</li>
                    <li>- Pool Access</li>
                    <li>- Billiard Table</li>
                    <li>- Free Use of Videoke</li>
                  </ul>
                </div>
              </div>
            </div>

            <Link to="/venues" className="group flex h-full flex-col overflow-hidden rounded-xl shadow-md">
              <img src={accommodationImage} alt="More venue packages" className="h-52 w-full object-cover" />

              <div className="flex flex-1 items-center justify-center bg-[#0f4da0]">
                <span className="bg-[#dbe3ee] px-6 py-2 text-sm font-semibold text-gray-800 transition group-hover:bg-white">
                  MORE PACKAGES
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="pb-10 pt-4">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-2xl font-semibold text-[#1f1f1f]">Book Your Room</h2>

          <p className="mt-2 text-gray-600">A Peaceful Stay Within Your Celebration.</p>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="overflow-hidden rounded-xl shadow-md">
              <img src={roomImage} alt="Watikolo Luxe Stay" className="h-52 w-full object-cover" />

              <div className="bg-[#0f4da0] pt-2">
                <div className="bg-[#dbe3ee] px-3 py-4 text-center text-sm text-gray-800">
                  <p className="font-semibold">WATIKOLO LUXE STAY</p>
                  <p className="mt-1 text-xs">price from</p>
                  <p className="font-semibold">PHP 1,999.00</p>
                  <p className="text-xs">per night</p>
                </div>
                <div className="h-2 bg-[#0f4da0]" />
              </div>
            </div>

            <div className="overflow-hidden rounded-xl shadow-md">
              <img src={room2Image} alt="Watikolo Grand Room" className="h-52 w-full object-cover" />

              <div className="bg-[#0f4da0] pt-2">
                <div className="bg-[#dbe3ee] px-3 py-4 text-center text-sm text-gray-800">
                  <p className="font-semibold">WATIKOLO GRAND ROOM</p>
                  <p className="mt-1 text-xs">price from</p>
                  <p className="font-semibold">PHP 2,499.00</p>
                  <p className="text-xs">per night</p>
                </div>
                <div className="h-2 bg-[#0f4da0]" />
              </div>
            </div>

            <Link to="/venues" className="group overflow-hidden rounded-xl shadow-md">
              <img src={room3Image} alt="More room options" className="h-52 w-full object-cover" />

              <div className="flex h-[120px] items-center justify-center bg-[#0f4da0]">
                <span className="bg-[#dbe3ee] px-6 py-2 text-sm font-semibold text-gray-800 transition group-hover:bg-white">
                  MORE ROOM
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section id="guest-reviews" className="bg-white py-10">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-2xl font-semibold text-[#1f1f1f]">Guest Review </h2>

          <div className="mt-8 grid gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-3">
                <img src="https://i.pravatar.cc/40?img=1" alt="Lyds Rod" className="h-10 w-10 rounded-full object-cover" />
                <p className="font-semibold text-[#1f1f1f]">Lyds Rod</p>
              </div>

              <div className="mt-2 text-sm text-yellow-400">5/5</div>

              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                We found Watikolo through our research online. Frankly, I was cautiously optimistic, but everything exceeded
                expectations. The place is truly amazing and peaceful...
              </p>

              <button className="mt-2 text-sm text-gray-400 hover:text-gray-600">Read more</button>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <img src="https://i.pravatar.cc/40?img=2" alt="Neil Pickford" className="h-10 w-10 rounded-full object-cover" />
                <p className="font-semibold text-[#1f1f1f]">Neil Pickford</p>
              </div>

              <div className="mt-2 text-sm text-yellow-400">5/5</div>

              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Stayed here with a group and the place is tucked away nicely but still accessible. The villa is new, clean,
                and perfect for big groups...
              </p>

              <button className="mt-2 text-sm text-gray-400 hover:text-gray-600">Read more</button>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <img src="https://i.pravatar.cc/40?img=3" alt="Jeselle Maris Buenafe" className="h-10 w-10 rounded-full object-cover" />
                <p className="font-semibold text-[#1f1f1f]">Jeselle Maris Buenafe</p>
              </div>

              <div className="mt-2 text-sm text-yellow-400">5/5</div>

              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                100/10! Everything about this place is superb. Booking was easy and the team is very responsive and
                accommodating...
              </p>

              <button className="mt-2 text-sm text-gray-400 hover:text-gray-600">Read more</button>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="mt-10">
        <div className="bg-[#2d2d2d] py-4 text-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-6 text-sm">
            <span>Purok 4, Upper Puntod Road, Tabalong, Dauis, Bohol, Philippines</span>
            <a href="tel:+639158748529" className="text-blue-400 hover:underline">
              +63 915 874 8529
            </a>
          </div>
        </div>

        <div className="relative h-[260px] overflow-hidden bg-gray-300">
          <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=Bohol&zoom=12&size=800x400')] bg-cover bg-center opacity-60 blur-sm" />

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <a
              href="https://maps.google.com"
              target="_blank"
              rel="noreferrer"
              className="rounded-md bg-white px-5 py-2 font-medium text-blue-600 shadow transition hover:bg-gray-100"
            >
              Explore our location
            </a>

            <p className="mt-3 text-sm text-white opacity-80">
              Google Maps is hidden to reduce page load time. Click to view.
            </p>
          </div>
        </div>

        <div className="bg-[#2d2d2d] py-4 text-white">
          <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 px-6 text-sm">
            <div className="flex gap-6">
              <a href="#" className="hover:underline">
                Terms and Conditions
              </a>
              <a href="#" className="hover:underline">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

