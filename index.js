require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());



app.get("/", async (req, res) => {
  const contactId = "130289779074"; // static for now
  const apiKey = process.env.HUBSPOT_API_KEY;

  const contactUrl = `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?associations=invoices&archived=false`;
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };


    try {
    const contactResponse = await axios.get(contactUrl, { headers });

    const invoiceAssociations = contactResponse.data?.associations?.invoices?.results || [];
    const invoiceIds = invoiceAssociations.map(inv => inv.id);

    if (invoiceIds.length === 0) {
      return res.json({ message: "No associated invoices found." });
    }


        const invoiceDetails = [];

    for (const invoiceId of invoiceIds) {
      const invoiceUrl = `https://api.hubapi.com/crm/v3/objects/invoices/${invoiceId}?properties=hs_invoice_link,hs_number`;

      try {
        const invoiceRes = await axios.get(invoiceUrl, { headers });

        invoiceDetails.push({
          id: invoiceRes.data.id,
          hs_invoice_link: invoiceRes.data.properties.hs_invoice_link,
          hs_number: invoiceRes.data.properties.hs_number,
        });
      } catch (invoiceError) {
        console.error(`Failed to fetch invoice ${invoiceId}`, invoiceError?.response?.data || invoiceError.message);
      }
    }



        return res.json({
      contactId,
      invoiceDetails,
    });

  } catch (err) {
    console.error("Error fetching contact/invoices:", err?.response?.data || err.message);
    res.status(500).send("Something went wrong");
  }
});



app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
