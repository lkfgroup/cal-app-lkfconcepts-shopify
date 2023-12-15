import Shop from "./models/shop.model.js";
import shopify from "./shopify.js";

const fulFillOrder = async (shop, order_id) => {
  try {
    let shopData = await Shop.findOne({ shop });

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

    return true;
  } catch (error) {
    return false;
  }
}

export default fulFillOrder;