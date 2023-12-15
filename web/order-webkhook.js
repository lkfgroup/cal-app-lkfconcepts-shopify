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

    let date = payload.line_items[0].properties.find(prop => prop.name === 'Booking date')?.value || ''
    let time = payload.line_items[0].properties.find(prop => prop.name === 'Booking time')?.value || ''
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
  
      let productName = products.filter((p) => p.product_type == "Experience").map((p) => {
        return `${p.name} x ${p.quantity}`
      })
  
      let deposit = 0;
  
      products.forEach((p) => {
        deposit += (Number(p.price) * Number(p.quantity)) - Number(p.total_discount);
      })
  
      const request = `Product Name: ${productName.join(", ")}, Order ID: LKFC${payload.order_number}, Deposit: HK$${deposit}, Special Request: ${payload?.note ? payload?.note : ""}`

      const data = {
        restaurant: getRestaurant(payload.line_items[0].vendor),
        cover: payload.line_items[0].quantity,
        date: dateFormat.format('YYYY-MM-DD'),
        time: time,
        source: process.env.SOURCE,
        credential: process.env.CREDENTIAL,
        email: payload.email,
        firstname: payload?.customer?.first_name ? payload?.customer?.first_name : "",
        lastname: payload?.customer?.last_name ? payload?.customer?.last_name : "",
        phone: payload?.customer?.phone ? payload?.customer?.phone : "",
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
    return "HK_HK_R_LkfCiaoChow"
  }
  for (let item of restaurantList) {
    const [key, value] = item.split('HK_HK_R_Lkf')

    if (vendor && value.toLowerCase().includes(vendor.replace(" ", "").toLowerCase())) {
      return item
    }

  }

}
export default processOrderCreatedWebhook;
