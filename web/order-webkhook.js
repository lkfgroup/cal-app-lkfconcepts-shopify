import moment from "moment";
import { _axios } from "./index.js";
import shopModel from "./models/shop.model.js";
import shopify from "./shopify.js";
import fulFillOrder from "./fulfill-order.js";

const processOrderCreatedWebhook = async (webhook, test = false) => {

  try {
    let { shop, payload } = webhook;

    let shopData = await shopModel.findOne({ shop });

    let client = new shopify.api.clients.Rest({
      session: {
        shop: shopData.shop,
        accessToken: shopData.token,
      },
    });

    let date;
    let time;
    let vendor;

    let line_items = payload.line_items
    for (let i = 0; i < line_items.length; i++) {
      let line_item = line_items[i];
      date = line_item.properties.find(prop => prop.name === 'Booking date')?.value || '';
      time = line_item.properties.find(prop => prop.name === 'Booking time')?.value || '';
      vendor = line_item.vendor;
      if (date && time && vendor) {
        break;
      }
    }
    let financial_status = payload?.financial_status || ''
    if (date && time && financial_status == 'paid') {
      let dateFormat = moment(date);
      if (dateFormat.year() === 2001 && !(date || "").includes("2001")) {
        dateFormat.set("year", moment().year());
      }
      
      let products = await Promise.all(payload?.line_items.map(async (line_item) => {
        let id = line_item?.product_id;
        let response = await client.get({
          path: `products/${id}`
        })
        let product_type = response?.body?.product?.product_type ? response?.body?.product?.product_type : ""
        return {
          name: line_item?.title,
          quantity: line_item?.quantity,
          price: line_item?.price,
          total_discount: line_item?.total_discount,
          product_type,
        }
      }))

      let quantity = 0
          
      products.filter((p) => p.product_type == "Experience").forEach((p) => {
        quantity += Number(p.quantity);
      })

      products = products.filter((p) => p.product_type != "Gift Card");

      let productName = products.map((p) => {
        return `${p.name} x ${p.quantity}`
      })
  
      let deposit = 0;
  
      products.forEach((p) => {
        deposit += (parseFloat(p.price) * Number(p.quantity)) - parseFloat(p.total_discount);
      })
  
      const request = `Product Name: ${productName.join(", ")}, Order ID: LKFC${payload.order_number}, Deposit: HK$${deposit.toFixed(2)}, Special Request: ${payload?.note ? payload?.note : ""}`

      const data = {
        restaurant: getRestaurant(vendor),
        cover: quantity,
        date: dateFormat.format('YYYY-MM-DD'),
        time: time,
        source: process.env.SOURCE,
        credential: process.env.CREDENTIAL,
        email: payload.email,
        firstname: payload?.customer?.first_name ? payload?.customer?.first_name : "",
        lastname: payload?.customer?.last_name ? payload?.customer?.last_name : "",
        phone: payload?.customer?.phone ? payload?.customer?.phone : "",
        notify: "yes",
        request: request
      }
      console.log(data);
      if (!test) {
      const result = await _axios.post(`${process.env.BASE_URL}/booking/create`, data);
      console.log('test', result)
      const fulfill = await fulFillOrder(shop, payload.id);
      console.log("fulfill", fulfill);
      }
    }

  } catch (error) {
    console.log(error);
  }
}

const getRestaurant = (vendor) => {
  const restaurantList = process.env.RESTAURANT_ID.split(',')
  if (vendor && vendor.toLowerCase() === 'baci') {
    return "HK_HK_R_LkfBACI"
  }
  for (let item of restaurantList) {
    const [key, value] = item.split('HK_HK_R_Lkf')

    if (vendor && value && value.toLowerCase().includes(vendor.replace(" ", "").toLowerCase())) {
      return item
    }

  }

}
export default processOrderCreatedWebhook;
