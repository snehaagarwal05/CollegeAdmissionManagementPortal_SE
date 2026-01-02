const ApplicationFee = () => {
  const payNow = async () => {
    const res = await fetch("http://localhost:5000/api/payment/create-order", {
      method: "POST",
    });

    const order = await res.json();

    const options = {
      key: "rzp_test_RwgFDs9MUgUeV0",
      amount: order.amount,
      currency: "INR",
      name: "College Admission",
      description: "Application Fee ₹100",
      order_id: order.id,
      handler: async function (response) {
        const verify = await fetch("http://localhost:5000/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(response),
        });

        const result = await verify.json();
        if (result.success) {
          alert("Payment successful 🎉");
        } else {
          alert("Payment failed");
        }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div>
      <h2>Pay Application Fee</h2>
      <button onClick={payNow}>Pay ₹100</button>
    </div>
  );
};

export default ApplicationFee;
