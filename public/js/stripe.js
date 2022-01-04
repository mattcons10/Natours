/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';
//import Stripe from 'stripe';

const stripe = Stripe(
  'pk_test_51KCTtZCxSfLt5oj1IQy1tWJZaeoS53p5jmy8ejCGQimV6ejEYex0GVCzg5EkWXiZElNGW2lDOfIxq21rHwEMX8r500JB1Q2hfD'
);

export const bookTour = async (tourId) => {
  try {
    //get session from api
    const session = await axios(
      `http://127.0.0.1:8000/api/v1/booking/checkout-session/${tourId}`
    );
    console.log(session);
    //use stripe object to create checkout form + charge the credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
