import fs from 'fs';
import path from 'path';
import inlineCSS from 'inline-css';
import mailgun from 'mailgun-js';
import ejs from 'ejs';
import moment from 'moment';
import { getInvoiceMeta, getWalletMeta } from './beautifier';
import { db } from '../config/firebase';

const mg = mailgun({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN
});
const debug = require('debug')('app:mailer');

export const sendInvoiceMail = async (body) => {
  return new Promise(async (resolve, reject) => {
    try {
      const invoiceEJSFile = fs.readFileSync(
        path.join(__dirname, '..', '..', 'views', 'invoice_created.ejs'),
        'utf8'
      );

      const invoiceCSSFile = fs.readFileSync(
        path.join(__dirname, '..', '..', 'css', 'invoice.css'),
        'utf8'
      );

      const emailMeta = getInvoiceMeta(body);

      /// where is the amount paid ra
      let renderedHtml = ejs.render(
        invoiceEJSFile,
        {
          data: {
            customer_name: body.customer.name,
            invoice_date: moment.unix(body.created_at).format('ll'),
            invoice_id: body.invoiceId,
            amount_due: body.amount_due / 100,
            amount_paid: body.amount_paid / 100,
            due_date: moment.unix(body.expire_by).format('ll'),
            description: body.vessel.name,
            amount: body.total / 100,
            total: body.total / 100,
            payment_url: `https://adani-invoicing.now.sh/invoices/${body.invoiceId}`,
            account: body.receivers[0],
            ...emailMeta
          },
          css: invoiceCSSFile
        },
        { rmWhitespace: true }
      );

      const inlineHtml = await inlineCSS(renderedHtml, {
        url: ' '
      });

      const data = {
        from: 'Adani Ports and sez <no-reply@adani.ports.invoicing.com>',
        to: body.customer.email,
        subject: emailMeta.subject,
        html: inlineHtml.toString()
      };
      mg.messages().send(data, function (error, body) {
        resolve(body);
      });
    } catch (e) {
      debug(e);
      reject(e);
    }
  });
};

//Function to trigger the reminder mails

export const sendReminderMail = async (body) => {
  return new Promise(async (resolve, reject) => {
    try {
      const invoiceEJSFile = fs.readFileSync(
        path.join(__dirname, '..', '..', 'views', 'invoice_created.ejs'),
        'utf8'
      );

      const invoiceCSSFile = fs.readFileSync(
        path.join(__dirname, '..', '..', 'css', 'invoice.css'),
        'utf8'
      );

      const emailMeta = {
        emailMessage: `This iss just to remind you that payment on invoice ${
          body.invoiceId
        },which was sent on ${moment
          .unix(body.created_at)
          .format('ll')}, will be due on  ${moment
          .unix(body.due_date)
          .format(
            'll'
          )}. <br/>We would appreciate if you could take a moment and look over the invoice. As per out terms invoices over dued are charged additionally as part of interest`,
        buttonText: 'Pay Invoice',
        subject: `Follow-op on invoice ID-${
          body.invoiceId
        } -due date  ${moment.unix(body.due_date).format('ll')}`,
        buttonColor: `blue`
      };

      debug(emailMeta);

      /// where is the amount paid ra
      let renderedHtml = ejs.render(
        invoiceEJSFile,
        {
          data: {
            customer_name: body.customer.name,
            invoice_date: moment.unix(body.created_at).format('ll'),
            invoice_id: body.invoiceId,
            amount_due: body.amount_due / 100,
            amount_paid: body.amount_paid / 100,
            due_date: moment.unix(body.expire_by).format('ll'),
            description: body.vessel.name,
            amount: body.total / 100,
            total: body.total / 100,
            payment_url: `https://adani-invoicing.now.sh/invoices/${body.invoiceId}`,
            emailMessage: emailMeta.emailMessage,
            buttonText: emailMeta.buttonText,
            buttonColor: emailMeta.buttonColor
          },
          css: invoiceCSSFile
        },
        { rmWhitespace: true }
      );

      const inlineHtml = await inlineCSS(renderedHtml, {
        url: ' '
      });

      const data = {
        from: 'Adani Ports and sez <no-reply@adani.ports.invoicing.com>',
        to: body.customer.email,
        subject: emailMeta.subject,
        html: inlineHtml.toString()
      };
      mg.messages().send(data, function (error, body) {
        resolve(body);
      });
    } catch (e) {
      debug(e);
      reject(e);
    }
  });
};

//Function to send mails related to wallet transactions

export const sendWalletMail = async (body) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!body.uid) {
        reject({
          code: 400,
          message: 'Please provide the uid with the request'
        });
        return;
      }
      const user = await db.collection('users').doc(body.uid).get();
      if (!user.exists) {
        reject({
          code: 400,
          message: `No, user present with the uid ${body.uid} in the database`
        });
        return;
      }
      const combinedData = { ...body, ...user.data() };

      const invoiceEJSFile = fs.readFileSync(
        path.join(__dirname, '..', '..', 'views', 'wallet_mail.ejs'),
        'utf8'
      );

      const emailMeta = getWalletMeta(combinedData);

      /// where is the amount paid ra
      let renderedHtml = ejs.render(
        invoiceEJSFile,
        {
          data: {
            customer_name: combinedData.name,
            transaction_id: body.id,
            timestamp: moment.unix(body.created_at).format('ll'),
            wallet_url: `https://adani-invoicing.now.sh/wallet`,
            amount: combinedData.amount,
            ...emailMeta
          }
        },
        { rmWhitespace: true }
      );

      const inlineHtml = await inlineCSS(renderedHtml, {
        url: ' '
      });

      debug(inlineHtml);
      const data = {
        from: 'Adani Ports and sez <no-reply@adani.ports.invoicing.com>',
        to: combinedData.email,
        subject: emailMeta.subject,
        html: inlineHtml.toString()
      };
      mg.messages().send(data, function (error, body) {
        resolve(body);
      });
    } catch (e) {
      debug(e);
      reject(e);
    }
  });
};
