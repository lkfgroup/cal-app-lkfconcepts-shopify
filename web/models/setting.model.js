import mongoose from "mongoose";

const settingSchema = mongoose.Schema(
    {
        shop: {
            type: "String",
            required: true,
        },
        type: {
            type: "String",
            required: true,
            default: "product",
        },
        product_id: {
            type: 'String',
            required: true
        },
        sku: {
            type: 'String',
            required: true,
            default: ''
        },
        settings: {
            type: "Object"
        }
    },
    { timestamps: true }
);

export default mongoose.model("Setting", settingSchema);
