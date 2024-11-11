import moment from "moment";
import { _axios } from "./index.js";
import shopModel from "./models/shop.model.js";
import shopify from "./shopify.js";
import fulFillOrder from "./fulfill-order.js";
import _ from "lodash";
import libphonenumber from libphonenumber;

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
    let discount;
    let vendor;

    let line_items = payload.line_items
    for (let i = 0; i < line_items.length; i++) {
      let line_item = line_items[i];
      date = line_item.properties.find(prop => prop.name === 'Booking date')?.value || '';
      time = line_item.properties.find(prop => prop.name === 'Booking time')?.value || '';
      discount = line_item.properties.find(prop => prop.name === 'Booking discount')?.value || '';
      vendor = line_item.vendor;
      if (date && time && vendor) {
        break;
      }
    }
    let financial_status = payload?.financial_status || ''
    if (date && time && financial_status == 'paid') {
      let dateFormat = moment(new Date(date));
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
          product_type,
          ...line_item
        }
      }))

      let quantity = 0
          
      products.filter((p) => p.product_type == "Experience").forEach((p) => {
        quantity += Number(p.quantity);
      })

      products = products.filter((p) => p.product_type != "Gift Card");

      let productName = [];

      let groups = _.groupBy(products, "variant_id");

      productName = Object.keys(groups).map((value, index) => {
        let group = groups[value];
        let quantity = _.sumBy(group, function(o) {
          return o.quantity
        })
        let variant = group[0];
        return `${variant.title}, ${variant.variant_title ? `${variant.variant_title} x ${quantity}` : `Default x ${quantity}`}`;
      })
  
      let deposit = 0;

      // let discounts = [];
      
      // payload?.discount_applications?.forEach((list) => {
      //   if (list?.title) {
      //     discounts.push(list?.title);
      //   } else if (list?.code) {
      //     discounts.push(list?.code);
      //   } else {

      //   }
      // })
  
      products.forEach((p) => {
        let total_discount = 0;
        p.discount_allocations.forEach(discount => {
          total_discount += parseFloat(discount.amount)
        })
        deposit += (parseFloat(p.price) * Number(p.quantity)) - parseFloat(p.total_discount) - parseFloat(total_discount);
      })
  
      let request = [
        `Product Name: ${productName.join(", ")}`,
        `Order ID: LKFC${payload.order_number}`,
        `Deposit: HK$${deposit.toFixed(2)}`,
      ]

      if (discount) {
        request.push(`Discounts: ${discount}`)
      }

      request.push(`Special Request: ${payload?.note ? payload?.note : ""}`)

      request = request.join(", ")

      // Gareth-Optimization-MY Changes START
      let cusPhoneNumber = payload?.customer?.phone ? payload?.customer?.phone : "";
      let formattedPhone = ""
      // IF original phone number has country code use this:
      if (cusPhoneNumber.includes('+')){
        const unFormatPhone = payload?.customer?.phone
        formattedPhone = unFormatPhone ? getCountryCode(unFormatPhone) : "";
      } else if (cusPhoneNumber === ""){
        console.log("Phone Number not provided")
      } else {
        let countryCode = payload?.billing_address?.country_code ? payload?.billing_address?.country_code : "";
        const libPhoneUtil = libphonenumbers.PhoneNumberUtil.getInstance();
        const unFormatPhone = payload?.customer?.phone ? payload?.customer?.phone : "";
        const cusPhoneCC = libPhoneUtil.parseAndKeepRawInput(unFormatPhone, countryCode);
        formattedPhone = `${cusPhoneCC} ${unFormatPhone}`;
      }
      // Gareth-Optimization-MY Changes END

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
        phone: formattedPhone,
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

const RESTAURANT_ID = "HK_HK_R_LkfFumi,HK_HK_R_LkfAriaItalian,HK_HK_R_LkfBACI,HK_HK_R_LkfKyotojoe,HK_HK_R_LkfPorterhouse,HK_HK_R_LkfTokiojoe"

const getRestaurant = (vendor) => {
  const restaurantList = RESTAURANT_ID.split(',')
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

function getCountryCode( input ) {
  // Set default country code to US if no real country code is specified
  const defaultCountryCode = input.substr( 0, 1 ) !== '+' ? 'US' : null;
  let formatted = new libphonenumber.asYouType( defaultCountryCode ).input( input );
  let countryCode = '';
  let withoutCountryCode = formatted;
  
  if ( defaultCountryCode === 'US' ) {
    countryCode = '+1';
    formatted = '+1 ' + formatted;
  }
  else {
    const parts = formatted.split( ' ' );
    countryCode = parts.length > 1 ? parts.shift() : '';
    withoutCountryCode = parts.join( ' ' );
  }
  
  return {
    formatted,
  }
}
export default processOrderCreatedWebhook;
