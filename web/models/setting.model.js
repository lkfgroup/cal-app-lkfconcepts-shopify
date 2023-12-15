import mongoose from "mongoose";

const settingSchema = mongoose.Schema(
    {
        shop: {
            type: "String",
            required: true,
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
