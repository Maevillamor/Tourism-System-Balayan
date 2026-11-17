
import React, { useState } from "react";
import "../style.css";

export default function AppointmentForm() {
  const [visitorType, setVisitorType] = useState("");
  const [service, setService] = useState("");
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [purpose, setPurpose] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [showReview, setShowReview] = useState(false);

  const visitorTypes = [
    {
      title: "Citizen",
      description: "For personal and public services.",
    },
    {
      title: "Student",
      description: "For education-related visits.",
    },
    {
      title: "Government",
      description: "For official government visits.",
    },
    {
      title: "Business",
      description: "For business-related services.",
    },
  ];

  const handleReview = (e) => {
    e.preventDefault();

    if (!visitorType || !service || !time || !date ||
        !purpose || !name || !mobile) {
      alert("Please complete all required fields.");
      return;
    }

    setShowReview(true);
  };

  return (
    <div className="appointment-page">

      {/* HEADER */}
      <header className="appointment-header">
        <h2>Appointments</h2>
        <span>APPOINTMENT REQUEST</span>
      </header>

      <main className="appointment-container">

        {/* INTRODUCTION */}
        <section className="intro-section">
          <span className="section-label">BOOK AN APPOINTMENT</span>
          <h1>Book your appointment</h1>
          <p>
            Choose your visitor type and tell us when and why
            you would like to visit.
          </p>
        </section>

        <form onSubmit={handleReview}>

          {/* VISITOR TYPE */}
          <section className="visitor-section">
            <h3>01 Visitor type</h3>
            <p>Choose the option that best describes your visit.</p>

            <div className="visitor-grid">
              {visitorTypes.map((visitor) => (
                <div
                  key={visitor.title}
                  className={`visitor-card ${
                    visitorType === visitor.title ? "selected" : ""
                  }`}
                  onClick={() => setVisitorType(visitor.title)}
                >
                  <div>
                    <h4>{visitor.title}</h4>
                    <p>{visitor.description}</p>
                  </div>

                  <span className="radio-circle">
                    {visitorType === visitor.title && (
                      <span className="radio-inner"></span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            <small className="helper-text">
              {visitorType
                ? `Selected visitor type: ${visitorType}`
                : "Please select one visitor type to begin."}
            </small>
          </section>

          {/* MAIN CONTENT */}
          <div className="appointment-layout">

            <div className="form-left">

              {/* APPOINTMENT DETAILS */}
              <section className="form-card">
                <h3>02 Appointment details</h3>

                <div className="input-grid">

                  <div className="form-group">
                    <label>Type of Service *</label>
                    <select
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                      required
                    >
                      <option value="">Select a service</option>
                      <option value="Tourism Information">
                        Tourism Information
                      </option>
                      <option value="Travel Assistance">
                        Travel Assistance
                      </option>
                      <option value="Tourism Accreditation">
                        Tourism Accreditation
                      </option>
                      <option value="Other Services">
                        Other Services
                      </option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Preferred time *</label>
                    <select
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                    >
                      <option value="">Select a Time</option>
                      <option value="8:00 AM - 9:00 AM">
                        8:00 AM - 9:00 AM
                      </option>
                      <option value="9:00 AM - 10:00 AM">
                        9:00 AM - 10:00 AM
                      </option>
                      <option value="10:00 AM - 11:00 AM">
                        10:00 AM - 11:00 AM
                      </option>
                      <option value="1:00 PM - 2:00 PM">
                        1:00 PM - 2:00 PM
                      </option>
                      <option value="2:00 PM - 3:00 PM">
                        2:00 PM - 3:00 PM
                      </option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Preferred date *</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Purpose of visit *</label>
                    <textarea
                      placeholder="Briefly describe what you need help with"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      required
                    />
                  </div>

                </div>
              </section>

              {/* CONTACT DETAILS */}
              <section className="form-card contact-card">
                <h3>03 Contact details</h3>

                <div className="form-group full-width">
                  <label>Full name *</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="input-grid">
                  <div className="form-group">
                    <label>Email address (optional) *</label>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Mobile number *</label>
                    <input
                      type="tel"
                      placeholder="Enter your mobile number"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </section>

              <small className="required-note">
                * Required fields
              </small>

            </div>

            {/* RIGHT SIDEBAR */}
            <aside className="sidebar">

              <section className="summary-card">
                <h3>Your appointment</h3>
                <p>Review your choices before continuing.</p>

                <div className="summary-item">
                  <span>Visitor type</span>
                  <strong>{visitorType || "Not selected"}</strong>
                </div>

                <div className="summary-item">
                  <span>Service</span>
                  <strong>{service || "Not selected"}</strong>
                </div>

                <div className="summary-item">
                  <span>Location</span>
                  <strong>Not selected</strong>
                </div>

                <div className="summary-item">
                  <span>Date & time</span>
                  <strong>
                    {date && time
                      ? `${date} | ${time}`
                      : "Not selected"}
                  </strong>
                </div>
              </section>

              <section className="visit-card">
                <h3>Before your visit</h3>

                <div className="visit-tip">
                  <h4>Prepare your documents</h4>
                  <p>
                    Check the selected service for required
                    identification and supporting documents.
                  </p>
                </div>

                <div className="visit-tip">
                  <h4>Check your schedule</h4>
                  <p>
                    Choose a date and time that works for you.
                    Available slots depend on the office.
                  </p>
                </div>

                <div className="visit-tip">
                  <h4>Keep your confirmation</h4>
                  <p>
                    Once your booking is confirmed, save the
                    appointment details for check-in.
                  </p>
                </div>
              </section>

            </aside>
          </div>

          {/* INFORMATION NOTICE */}
          <div className="information-notice">
            Your contact details will be used for appointment
            updates and follow-up about your visit.
          </div>

          {/* FOOTER */}
          <div className="form-footer">
            <p>You can review your details before submitting your request.</p>

            <button type="submit" className="review-button">
              Review appointment
            </button>
          </div>

        </form>
      </main>

      {/* REVIEW MODAL */}
      {showReview && (
        <div className="modal-overlay">
          <div className="review-modal">
            <h2>Review your appointment</h2>
            <p>Please check your information before proceeding.</p>

            <div className="review-details">
              <p><strong>Visitor:</strong> {visitorType}</p>
              <p><strong>Service:</strong> {service}</p>
              <p><strong>Date:</strong> {date}</p>
              <p><strong>Time:</strong> {time}</p>
              <p><strong>Purpose:</strong> {purpose}</p>
              <p><strong>Name:</strong> {name}</p>
              <p><strong>Email:</strong> {email || "Not provided"}</p>
              <p><strong>Mobile:</strong> {mobile}</p>
            </div>

            <button
              className="close-button"
              onClick={() => setShowReview(false)}
            >
              Back to editing
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
