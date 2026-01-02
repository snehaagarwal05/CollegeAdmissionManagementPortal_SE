import React from "react";
import "./About.css";
import { motion } from "framer-motion";
import Footer from "../footer/footer";

const About = () => {
  return (
    <div className="about-page">

      {/* HERO SECTION */}
      <div className="about-banner">
        <motion.h1
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Technology Institute of Engineering
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          Empowering Innovation. Engineering the Future.
        </motion.p>

        <motion.div
          className="hero-buttons"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
        </motion.div>
      </div>

      {/* ABOUT SECTION */}
      <div className="about-section">
        <h2>Who We Are</h2>
        <p>
          Technology Institute of Engineering (TIE), established in 2005, is a
          premier engineering institution focused on academic excellence,
          industry-driven education, and innovation. TIE prepares students to
          become globally competent engineers through practical learning,
          research exposure, and strong ethical values.
        </p>
      </div>

      {/* STATS */}
      <div className="stats-section">
        {[
          ["18+", "Years of Excellence"],
          ["6,500+", "Students Enrolled"],
          ["120+", "Faculty Members"],
          ["40+", "Industry Collaborations"]
        ].map(([num, label], index) => (
          <motion.div
            whileHover={{ scale: 1.08 }}
            key={index}
            className="stat-card"
          >
            <h3>{num}</h3>
            <p>{label}</p>
          </motion.div>
        ))}
      </div>

      {/* VISION & MISSION */}
      <div className="vision-mission">
        <motion.div whileHover={{ y: -5 }} className="vm-card">
          <h2>🎯 Vision</h2>
          <p>
            To become a globally recognized institute in engineering education
            and research, fostering innovation and sustainable technological
            development.
          </p>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="vm-card">
          <h2>🚀 Mission</h2>
          <ul>
            <li>Deliver outcome-based engineering education</li>
            <li>Encourage innovation, research, and entrepreneurship</li>
            <li>Strengthen industry–academia partnerships</li>
            <li>Develop ethical and socially responsible engineers</li>
          </ul>
        </motion.div>
      </div>

      {/* CAMPUS HIGHLIGHTS */}
      <div className="highlights-section">
        <h2>Campus Highlights</h2>

        <div className="highlight-grid">

          <div className="highlight-card">
            <span>🏫</span>
            <h3>Modern Infrastructure</h3>
            <p>Wi-Fi enabled smart classrooms, modern labs, and digital libraries.</p>
          </div>

          <div className="highlight-card">
            <span>🔬</span>
            <h3>Advanced Research Labs</h3>
            <p>AI, Robotics, IoT, and Cyber Security labs with industry-level tools.</p>
          </div>

          <div className="highlight-card">
            <span>🤝</span>
            <h3>Industry Collaboration</h3>
            <p>Strong partnerships with TCS, Infosys, Wipro, Bosch, and more.</p>
          </div>

          <div className="highlight-card">
            <span>🎓</span>
            <h3>Excellent Placements</h3>
            <p>90%+ placement rate with top recruiters across engineering domains.</p>
          </div>

          <div className="highlight-card">
            <span>🏠</span>
            <h3>Hostel & Campus Life</h3>
            <p>Safe hostels, sports facilities, cafeterias, and vibrant campus culture.</p>
          </div>

          <div className="highlight-card">
            <span>📚</span>
            <h3>Student Support & Clubs</h3>
            <p>Technical clubs, cultural societies, mentoring, and career guidance.</p>
          </div>

        </div>
      </div>

      {/* TIMELINE */}
      <div className="timeline-section">
        <h2>Our Journey</h2>

        <div className="timeline">
          {[
            ["2005", "TIE was founded with 3 engineering departments"],
            ["2010", "Established AI & Robotics research center"],
            ["2017", "New academic blocks and advanced laboratories"],
            ["2022", "Ranked among top emerging engineering institutes"]
          ].map(([year, text], index) => (
            <div className="timeline-item" key={index}>
              <div className="circle"></div>
              <h3>{year}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default About;
