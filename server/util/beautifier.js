import get from 'lodash.get';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import invoice from './webhook/invoice';

export const getCustomerObject = (customer) => {
  let beautifiedCustomer = {
    name: get(customer, 'name'),
    email: get(customer, 'email'),
    contact: get(customer, 'number')
  };

  if (customer.created_at) {
    beautifiedCustomer = {
      ...beautifiedCustomer,
      created_at: customer.created_at
    };
  }

  if (customer.shipping_address && customer.billing_address) {
    const billing_address = {
      line1: get(customer, 'billing_address.line1'),
      line2: get(customer, 'billing_address.line2'),
      zip: get(customer, 'billing_address.zipcode'),
      city: get(customer, 'billing_address.city'),
      state: get(customer, 'billing_address.state'),
      country: get(customer, 'billing_address.country')
    };
    const shipping_address = {
      line1: get(customer, 'shipping_address.line1'),
      line2: get(customer, 'shipping_address.line2'),
      zip: get(customer, 'shipping_address.zipcode'),
      city: get(customer, 'shipping_address.city'),
      state: get(customer, 'shipping_address.state'),
      country: get(customer, 'shipping_address.country')
    };
    return {
      ...beautifiedCustomer,
      shipping_address: shipping_address,
      billing_address: billing_address
    };
  }
  if (customer.billing_address) {
    const address = {
      line1: get(customer, 'billing_address.line1'),
      line2: get(customer, 'billing_address.line2'),
      zip: get(customer, 'billing_address.zipcode'),
      city: get(customer, 'billing_address.city'),
      state: get(customer, 'billing_address.state'),
      country: get(customer, 'billing_address.country')
    };
    return { ...beautifiedCustomer, billing_address: address };
  } else if (customer.shipping_address) {
    const address = {
      line1: get(customer, 'shipping_address.line1'),
      line2: get(customer, 'shipping_address.line2'),
      zip: get(customer, 'shipping_address.zipcode'),
      city: get(customer, 'shipping_address.city'),
      state: get(customer, 'shipping_address.state'),
      country: get(customer, 'shipping_address.country')
    };
    return { ...beautifiedCustomer, shipping_address: address };
  } else return beautifiedCustomer;
};

export const createRazorpayObject = (invoiceBody) => {
  return {
    type: 'invoice',
    partial_payment: 1,
    customer: getCustomerObject(invoiceBody.customer),
    line_items: [
      {
        name: invoiceBody.type,
        amount:
          invoiceBody.igst +
          invoiceBody.sgst +
          invoiceBody.cgst +
          invoiceBody.total
      }
    ],
    expire_by: 1609459200,
    email_notify: 0
  };
};

export const beautifyInvoiceBody = (invoiceBody) => {
  let values = {
    igst: 0,
    sgst: 0,
    cgst: 0,
    total: 0
  };
  Object.keys(invoiceBody.services).map((item, index) => {
    values['igst'] = values['igst'] + invoiceBody.services[index]['igst'];
    values['sgst'] = values['sgst'] + invoiceBody.services[index]['sgst'];
    values['cgst'] = values['cgst'] + invoiceBody.services[index]['cgst'];
    values['total'] = values['total'] + invoiceBody.services[index]['rate'];
    //If changed also change the create razorPayObject
  });

  return {
    ...invoiceBody,
    ...values
  };
};

export const getInvoiceMeta = (body) => {
  switch (body.status.toLowerCase()) {
    case 'paid':
      return {
        emailMessage: `Thanks for using our services. We have received the payment for invoice ID-${body.invoiceId}. You can find the attached invoice below.`,
        buttonText: 'view invoice',
        subject: `Invoice paid- invoice ID-${body.invoiceId}`,
        buttonColor: `green`
      };
    case 'partially_paid':
      return {
        emailMessage: `We have received a partial payment for invoice ID-${
          body.invoiceId
        }. You can find the attached invoice below. 
        Please pay before the due date ${moment
          .unix(body.due_date)
          .format('ll')} to avoid interest on your invoice.`,
        buttonText: 'Pay Invoice',
        subject: `Invoice partially paid- invoice ID-${body.invoiceId}`,
        buttonColor: `blue`
      };
    case 'issued':
      return {
        emailMessage: `Thanks for using our services. This is an invoice for your recent services availed at Adani Ports & Sez dated on ${moment
          .unix(body.created_at)
          .format('ll')}
         'with invoice ID ${
           body.invoiceId
         }. Please pay before the due date to avoid the additional charges as part of interest.`,
        buttonText: 'Pay Invoice',
        subject: `Invoice generated- ID-${body.invoiceId}`,
        buttonColor: `green`
      };
    case 'over_due':
      return {
        emailMessage: `We are yet to receive payment for invoice ID ${
          body.invoiceId
        } which was due on  ${moment
          .unix(body.due_date)
          .format(
            'll'
          )}. Please let us know when we can expect to receive the payment. As per out terms invoices over dued are charged additionally as part of interest`,
        buttonText: 'Pay Invoice',
        subject: `Over due invoice ID-${
          body.invoiceId
        } -due date  ${moment.unix(body.due_date).format('ll')}`,
        buttonColor: `red`
      };
    default: {
      return {
        emailMessage: 'Test Email',
        buttonText: 'Text Button'
      };
    }
  }
};

export const getWalletMeta = (body) => {
  const amount_paid = body.amount_paid / 100;
  if (body.status === 'failed') {
    return {
      emailMessage: `Sorry to inform you that your transaction failed and money isn't added to your Adani Wallet.`,
      shortMessage: `Transaction Failed. Please try again.`,
      gifUrl: `https://i.pinimg.com/originals/6e/f9/f2/6ef9f2fd6425c578274e72ce1f44a778.gif`,
      buttonColor: 'red',
      subject: `Wallet transcation failed - ${body.id} `,
      amount_paid: amount_paid
    };
  }
  switch (body.transactionType) {
    case 'credited':
      return {
        emailMessage: `र${
          body.amount / 100
        } has been credited to your Adani wallet.`,
        shortMessage: `Credited to your wallet`,
        gifUrl: `https://www.mapbazar.com/payment/success.gif`,
        buttonColor: 'green',
        subject: `Wallet update - money credited - ${body.id} `,
        amount_paid: amount_paid
      };

    case 'debited':
      return {
        emailMessage: `र${
          body.amount / 100
        } has been debited from your Adani wallet.`,
        shortMessage: `Debited from your wallet`,
        gifUrl: `https://www.mapbazar.com/payment/success.gif`,
        buttonColor: 'blue',
        subject: `Wallet update - money debited - ${body.id} `,
        amount_paid: amount_paid
      };
    case 'refunded':
      return {
        emailMessage: `र${
          body.amount / 100
        } has been refunded to your Adani wallet.`,
        shortMessage: `refunded to your wallet`,
        gifUrl: `https://www.mapbazar.com/payment/success.gif`,
        buttonColor: 'green',
        subject: `Wallet update - money credited - ${body.id} `,
        amount_paid: amount_paid
      };
    default:
      return {
        emailMessage: `Test Message`,
        shortMessage: `Test Message`,
        gifUrl: `https://www.mapbazar.com/payment/success.gif`,
        buttonColor: 'blue',
        subject: `Test subject`,
        amount_paid: amount_paid
      };
  }
};

export const combineRazorpayWithInvoice = (razorpayObject, invoice) => {
  return {
    ...invoice,
    created_at: get(razorpayObject, 'created_at'),
    paid_at: get(razorpayObject, 'paid_at'),
    invoiceId: get(razorpayObject, 'id'),
    custId: get(razorpayObject, 'customer_id'),
    order_id: get(razorpayObject, 'order_id'),
    payment_id: get(razorpayObject, 'payment_id'),
    invoice_number: get(razorpayObject, 'invoice_number'),
    status: get(razorpayObject, 'status'),
    amount: get(razorpayObject, 'amount'),
    short_url: get(razorpayObject, 'short_url'),
    amount_due: get(razorpayObject, 'amount_due'),
    amount_paid: get(razorpayObject, 'amount_paid'),
    payments: []
  };
};

export const createWalletPaymentObject = (uid, invoice, transactionMoney) => {
  return {
    notes: [`Payment for invoice ${invoice.invoice_number}`, transactionMoney],
    uid: uid,
    entity: 'order',
    created_at: parseInt(moment().format('X')),
    currency: 'INR',
    id: uuidv4(),
    order_id: invoice.order_id,
    status: 'success',
    transactionType: 'debited',
    amount: transactionMoney
  };
};

export const createInvoicePaymentObject = (invoice, paymentObject) => {
  const getStatus = () => {
    if (invoice.amount_due - paymentObject.amount === 0) {
      return 'paid';
    } else {
      return 'partially_paid';
    }
  };

  return {
    ...invoice,
    walletPayment: true,
    status: getStatus(),
    paid_at: paymentObject.created_at,
    amount_paid: invoice.amount_paid + paymentObject.amount,
    amount_due: invoice.amount_due - paymentObject.amount,
    payments: [
      ...invoice.payments,
      {
        id: paymentObject.id,
        method: 'Adani Wallet',
        created_at: paymentObject.created_at,
        status: paymentObject.status,
        fee: 0,
        tax: 0,
        amount: paymentObject.amount
      }
    ]
  };
};
