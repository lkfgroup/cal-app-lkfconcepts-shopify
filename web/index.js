// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import mongoose from "mongoose";
import dotenv from "dotenv";
import _ from "lodash";
import Shop from "./models/shop.model.js";

import shopify from "./shopify.js";
import webhookHandlers from "./webhook-handlers.js";
import axios from "axios";
import cors from "cors";
import bodyParser from "body-parser";
import crypto from "crypto";

import { ApiVersion, DeliveryMethod, LATEST_API_VERSION } from "@shopify/shopify-api";
import shopModel from "./models/shop.model.js";
import moment from "moment";
import processOrderCreatedWebhook from "./order-webkhook.js";
import settingModel from "./models/setting.model.js";
import webhookModel from "./models/webhook.model.js";
import searchModel from "./models/search.model.js";

import cron from "node-cron";
import deleteBlockDates from "./cron-jobs.js";

dotenv.config();

mongoose.connect(`${process.env.MONGODB_HOST}/${process.env.MONGODB_DB}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    if (process.env.NODE_ENV !== "test") {
      console.log("Connected to %s", `${process.env.MONGODB_HOST}/${process.env.MONGODB_DB}`);
    }

    cron.schedule("0 0 0 * * *", () => {
      deleteBlockDates();
    });
  });

const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);
export const _axios = axios.create({
  headers: {
    'x-api-key': process.env.X_API_KEY,
    'shop': process.env.SHOP
  },
})

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  async (req, res, next) => {
    const { shop, accessToken } = res.locals.shopify.session;
    await Shop.findOneAndUpdate(
      { shop: shop },
      {
        shop: shop,
        token: accessToken,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    next();
  },
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers })
);

app.post("/api/webhook-test", express.json(), async (_req, res) => {
  try {
    // const payload = _req.body;
    // const webhook = new webhookModel({
    //   shop: _req.headers["x-shopify-shop-domain"],
    //   topic: _req.headers["x-shopify-topic"],
    //   webhookId: _req.headers["x-shopify-webhook-id"],
    //   payload
    // });
    const data = await webhookModel.findOne({ "payload.id": 5444903108863 });
    processOrderCreatedWebhook(data, true);
    res.status(200).send();
  } catch (error) {
    // console.log(error);
    res.status(200).send();
  }
});

app.post('/api/check_availability', cors(), bodyParser.json(),
  bodyParser.urlencoded({ extended: true }), async (_req, res) => {
    try {
      const { product_id, time = '11:00', date, cover, restaurant_id } = _req.body
      const availability = await _axios.post(`${process.env.BASE_URL}/booking/availability`, {
        date,
        restaurant: restaurant_id,
        source: process.env.SOURCE,
        credential: process.env.CREDENTIAL,
        cover
      })
      console.log({
        date,
        restaurant: restaurant_id,
        source: process.env.SOURCE,
        credential: process.env.CREDENTIAL,
        cover
      }, availability)
      const hoursDiff = moment(time, "HH:mm").subtract(9, 'hours');
      const minutesDiff = moment(time, "HH:mm").minutes();
      const halfHourIntervals = moment(hoursDiff).hours() * 2 + Math.floor(minutesDiff / 30);
      const availabilitySlot = availability.data.data.split(',')
      res.status(200).send({ available: availabilitySlot[halfHourIntervals] == 1 })
    } catch (error) {
      console.log(error),
      res.status(200).send({ available: false })
    }
  })
// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js
app.post('/api/store_front', cors(), bodyParser.json(), bodyParser.urlencoded({ extended: true }), async (_req, res) => {
  try {
    let { product_id, shop } = _req.body

    let result;

    if (_.isInteger(product_id)) {
      result = await settingModel.findOne({ product_id, shop }).lean();
    } else {
      result = await settingModel.findOne({ sku: product_id, shop }).lean();
    }

    if (_req?.body?.vendor) {
      let location = await settingModel.findOne({ type: "location", shop, "settings.vendor": _req?.body?.vendor}).lean();
      result = { ...result, location };
    }

    res.status(200).send({
      success: true,
      data: result || {}
    })
  } catch (error) {
    res.status(400).send({
      success: false
    })
  }
})
app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(express.json());

// API endpoints here

app.post('/api/get-locations', async (_req, res) => {
  let shop = _req.headers["shop"];
  try {
    const result = await settingModel.find({
      type: "location",
      shop
    }).sort({ createdAt: -1 }).lean();
    return res.status(200).send({
      success: true,
      data: result
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
    });
  }
})

app.post('/api/get-location', async (_req, res) => {
  let shop = _req.headers["shop"];
  try {
    const result = await settingModel.findOne(
      {
        _id:  new mongoose.Types.ObjectId(_req.body.id),
        shop
      }
    )
    res.status(200).send({
      success: true,
      data: result
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
    });
  }
})

app.post('/api/edit-location', async (_req, res) => {
  let shop = _req.headers["shop"];
  try {
    if (_req.body.id == "new") {
      let result = await settingModel.create({
        settings: _req.body.settings,
        shop,
        product_id: 1,
        type: "location"
      })
      return res.status(200).send({
        success: true,
        data: result
      });
    }
    let result = await settingModel.findOneAndUpdate(
      {
        _id:  new mongoose.Types.ObjectId(_req.body.id),
        shop
      },
      {
        settings: _req.body.settings,
        shop,
        product_id: 1,
        type: "location"
      },
      { new: true, upsert: true }
    )
    return res.status(200).send({
      success: true,
      data: result
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
    });
  }
})

app.post('/api/get_data', async (_req, res) => {
  try {
    const { product_id, shop } = _req.body
    const shopData = await Shop.findOne({ shop });
    const session = {
      shop: shopData.shop,
      accessToken: shopData.token
    };

    let result;
    let product;
    
    if (_.isInteger(product_id)) {
      result = await settingModel.findOne({ product_id, shop }).lean();
      product = await shopify.api.rest.Product.find({
        session,
        id: product_id,
      });
    } else {
      result = await settingModel.findOne({ sku: product_id, shop }).lean();
      product = await new shopify.api.clients.Graphql({ session }).query({
        data: `query {
          products(first: 1, query: "tag='SKU:${product_id}'") {
            edges {
              node {
                id
                title
              }
            }
          }
        }`,
      })
      product = _.get(product, "body.data.products.edges[0].node");
    }
    
    const data = {
      ...result,
      product: product || {}
    }

    res.status(200).send({
      success: true,
      data
    })
  } catch (error) {
    console.log(error),
      res.status(400).send({
        success: false
      })
  }
})
app.post('/api/fulfill_order', async (_req, res) => {
  try {
    const { shop, order_id, selected_date, discount, area, selected_time, area_label } = _req.body
    let shopData = await Shop.findOne({ shop });
    const order = new shopify.api.rest.Order({
      session: {
        shop: shopData.shop,
        accessToken: shopData.token
      }
    });
    order.id = order_id;
    order.note_attributes = [
      {
        "name": "Area",
        "value": area_label
      },
      {
        "name": "Date",
        "value": selected_date
      },
      {
        "name": "Time",
        "value": selected_time
      },
      {
        "name": "Discount",
        "value": discount
      }
    ];
    await order.save({
      update: true,
    });
    const result = await shopify.api.rest.FulfillmentOrder.all({
      session: {
        shop: shopData.shop,
        accessToken: shopData.token
      },
      order_id: order_id,
    });
    const fulfillment_order = result.data[0]
    let line_items_by_fulfillment_order = fulfillment_order.line_items?.map((line_item) => {
      return {
        "fulfillment_order_id": line_item.fulfillment_order_id,
        "fulfillment_order_line_items": [
          {
            "id": line_item.id,
            "quantity": line_item.quantity
          }
        ]
      }
    });

    const fulfillment = new shopify.api.rest.Fulfillment({
      session: {
        shop: shopData.shop,
        accessToken: shopData.token
      },
    });
    fulfillment.line_items_by_fulfillment_order = line_items_by_fulfillment_order;
    await fulfillment.save({
      update: true,
    });

    const data = await _axios.post(`${process.env.BASE_URL}/booking/create`, {
      restaurant: area,
      cover: fulfillment.line_items?.[0].quantity,
      date: moment(selected_date).format('YYYY-MM-DD'),
      time: selected_time,
      source: process.env.SOURCE,
      credential: process.env.CREDENTIAL,

    })
    res.status(200).send({
      success: true
    })
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
    });
  }
})
app.post('/api/edit-settings', async (_req, res) => {
  try {
    const shop = _req.headers["shop"];

    const { product_id, delivery } = _req.body;

    let result;

    if (_.isInteger(product_id)) {
      result = await settingModel.findOneAndUpdate({ product_id, shop }, { settings: delivery }, { new: true, upsert: true })
    } else {
      result = await settingModel.findOneAndUpdate({ sku: product_id, shop }, { settings: delivery }, { new: true, upsert: true })
    }

    res.status(200).send({
      success: true,
      data: result
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
    });
  }
})

app.post('/api/products', async (_req, res) => {
  try {
    let shop = _req.headers["shop"];

    let { keySearch, after = null, before = null, limit = 100, vendor, product_type, status } = _req.body

    let shopData = await Shop.findOne({ shop });

    let client = new shopify.api.clients.Graphql({
      session: {
        shop: shopData.shop,
        accessToken: shopData.token,
      },
    });

    let filters = [
      `${!after && before ? 'last' : 'first'}: ${limit}`,
      `${!after && before ? 'before' : 'after'}: ${!after && before ? JSON.stringify(before) : after ? JSON.stringify(after) : null}`
    ];

    let query = [];

    if (keySearch) {
      query.push(`(title:*${keySearch}*)`)
    }

    if (vendor) {
      let search = vendor.map((v) => {
        return `vendor:'${v}'`;
      })
      query.push(`(${search.join(" OR ")})`);
    }

    if (product_type) {
      let search = product_type.map((t) => {
        return `product_type:'${t}'`;
      })
      query.push(`(${search.join(" OR ")})`);
    }

    if (status) {
      query.push(`(status:${status})`)
    }

    if (query) {
      filters.push(`query: "${query.join(" AND ")}"`)
    }

    let data = await client.query({
      data: `query {
        products(${filters.join(",")}) {
          edges {
            node {
              id
              title
              featuredImage {
                url
              }
              tags
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
        }
      }`,
    });
    res.status(200).send({
      success: true,
      data: data.body.data.products.edges,
      pageInfo: data.body.data.products.pageInfo
    })
  } catch (error) {
    console.log(error)
    res.status(400).send({
      success: false,
      error: error
    })
  }
})
app.get('/api/orders/:id', async (_req, res) => {
  try {
    let shop = _req.headers["shop"];
    let id = _req.params.id;
    let shopData = await Shop.findOne({ shop });
    let client = new shopify.api.clients.Graphql({
      session: {
        shop: shopData.shop,
        accessToken: shopData.token,
      },
    });
    const data = await client.query({
      data: `query {
        order(id: ${JSON.stringify(`gid://shopify/Order/${id}`)}) {
          id
          name
          createdAt
          lineItems(first:10){
            edges{
              node{
                product{
                  id
                }
              }
            }
          }
        }
      }`
    });

    console.log(`query {
      order(id: ${JSON.stringify(`gid://shopify/Order/${id}`)}) {
        id
        name
        createdAt
        lineItems(first:10){
          edges{
            node{
              product{
                id
              }
            }
          }
        }
      }
    }`)

    res.status(200).send({
      success: true,
      data: data.body.data.order
    })
  } catch (error) {
    res.status(400).send({
      success: false,
      error: error
    })
  }
})
app.get('/api/orders', async (_req, res) => {
  try {
    let shop = _req.headers["shop"];
    const { keySearch, after = null, before = null, limit = 100
    } = _req.query
    let shopData = await Shop.findOne({ shop });
    let client = new shopify.api.clients.Graphql({
      session: {
        shop: shopData.shop,
        accessToken: shopData.token,
      },
    });
    const data = await client.query({
      data: `query {
        orders(reverse:true, ${!after && before ? 'last' : 'first'}: ${limit},${!after && before ? 'before' : 'after'}:${!after && before ? JSON.stringify(before) : after ? JSON.stringify(after) : null},${keySearch ? `query: "name:*${keySearch}*"` : ""
        }) {
          edges {
            node {
              id
              name
              createdAt
              lineItems(first:10){
                edges{
                  node{
                    product{
                      id
                    }
                  }
                }
              }
            
            }
          }
         
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
        }
      }`,
    });

    res.status(200).send({
      success: true,
      data: data.body.data.orders.edges.sort((a, b) => new Date(b.node.createdAt) - new Date(a.node.createdAt)),
      pageInfo: data.body.data.orders.pageInfo
    })
  } catch (error) {
    res.status(400).send({
      success: false,
      error: error
    })
  }
})
app.get('/api/draft_orders/:id', async (_req, res) => {
  try {
    let shop = _req.headers["shop"];
    let id = _req.params.id;
    let shopData = await Shop.findOne({ shop });
    let client = new shopify.api.clients.Graphql({
      session: {
        shop: shopData.shop,
        accessToken: shopData.token,
      },
    });
    const data = await client.query({
      data: `query {
        draftOrder(id: ${JSON.stringify(`gid://shopify/DraftOrder/${id}`)}) {
          id
          name
          createdAt
          lineItems(first:10){
            edges{
              node{
                product{
                  id
                }
              }
            }
          }
        }
      }`
    });

    res.status(200).send({
      success: true,
      data: data.body.data.draftOrder
    })
  } catch (error) {
    res.status(400).send({
      success: false,
      error: error
    })
  }
})
app.get('/api/draft_orders', async (_req, res) => {
  try {
    let shop = _req.headers["shop"];
    const { keySearch, after = null, before = null, limit = 100
    } = _req.query
    let shopData = await Shop.findOne({ shop });
    let client = new shopify.api.clients.Graphql({
      session: {
        shop: shopData.shop,
        accessToken: shopData.token,
      },
    });
    const data = await client.query({
      data: `query {
        draftOrders(${!after && before ? 'last' : 'first'}: ${limit},${!after && before ? 'before' : 'after'}:${!after && before ? JSON.stringify(before) : after ? JSON.stringify(after) : null},${keySearch ? `query: "status:OPEN, name:*${keySearch}*"` : `query: "status:OPEN"`
        }) {
          edges {
            node {
              id
              name
              createdAt
              lineItems(first:10){
                edges{
                  node{
                    product{
                      id
                    }
                  }
                }
              }
            
            }
          }
         
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
        }
      }`,
    });

    console.log(data.body.data);

    res.status(200).send({
      success: true,
      data: data.body.data.draftOrders.edges.sort((a, b) => new Date(b.node.createdAt) - new Date(a.node.createdAt)),
      pageInfo: data.body.data.draftOrders.pageInfo
    })
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      error: error
    })
  }
})
app.post('/api/fulfill_draft_order', async (_req, res) => {
  try {
    const { shop, draft_order_id, selected_date, discount, area, selected_time, area_label } = _req.body
    let shopData = await Shop.findOne({ shop });

    let find_draft_order = await shopify.api.rest.DraftOrder.find({
      session: {
        shop: shopData.shop,
        accessToken: shopData.token
      },
      id: draft_order_id,
    });

    let lineItems = find_draft_order?.line_items

    lineItems[0].properties.push({
      name: "Booking date",
      value: selected_date
    });

    lineItems[0].properties.push({
      name: "Booking time",
      value: selected_time
    });

    let draft_order = new shopify.api.rest.DraftOrder({
      session: {
        shop: shopData.shop,
        accessToken: shopData.token
      }
    });

    draft_order.id = draft_order_id;

    draft_order.line_items = lineItems;

    await draft_order.save({
      update: true
    })

    let completeResponse = await draft_order.complete({});

    let order_id = completeResponse?.draft_order?.order_id;

    const order = new shopify.api.rest.Order({
      session: {
        shop: shopData.shop,
        accessToken: shopData.token
      }
    });
    
    order.id = order_id;

    order.note_attributes = [
      {
        "name": "Area",
        "value": area_label
      },
      {
        "name": "Date",
        "value": selected_date
      },
      {
        "name": "Time",
        "value": selected_time
      },
      {
        "name": "Discount",
        "value": discount
      }
    ];

    await order.save({
      update: true,
    });

    await processOrderCreatedWebhook({
      shop,
      payload: order
    }, false)

    res.status(200).send({
      success: true
    })
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
    });
  }
})

app.post('/api/save_search', async (_req, res) => {
  try {
    let shop = _req.headers["shop"];

    let saved_searches = await searchModel.find({ shop });

    res.status(200).send({
      success: true,
      saved_searches
    })
  } catch (error) {
    console.log(error)
    res.status(400).send({
      success: false,
    })
  }
})

app.post('/api/update_save_search', async (_req, res) => {
  try {
    let shop = _req.headers["shop"];

    let { _id, action, name, filters } = _req.body;

    let result;

    if (action == "DELETE") {
      result = await searchModel.deleteOne({
        _id: new mongoose.Types.ObjectId(_id),
      });
    } else if (action == "CREATE") {
      result = await searchModel.create({
        shop,
        name,
        filters
      })
    } else {
      result = await searchModel.findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(_id),
        },
        {
          shop,
          name,
          filters
        },
        { new: true, upsert: true }
      )
    }

    res.status(200).send({
      success: true,
      result
    })
  } catch (error) {
    console.log(error)
    res.status(400).send({
      success: false,
    })
  }
})

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));
app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")));
});


app.listen(PORT);
