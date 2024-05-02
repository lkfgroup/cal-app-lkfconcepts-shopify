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
        settings: {
            type: "Object"
        }
    },
    { timestamps: true }
);

export default mongoose.model("Setting", settingSchema);
