import React from "react";
import { useNavigate } from "react-router-dom";

export default function PaymentPage() {
  const navigate = useNavigate();

  const handlePay = () => {
    alert("Payment Successful! 🎉");
    navigate("/student");
  };

  return (
    <div className="dashboard">
      <h2>💳 Admission Fee Payment</h2>
      <p>Total Fee: ₹25,000</p>
      <button onClick={handlePay} className="pay-btn">
        Pay Now
      </button>
    </div>
  );
}