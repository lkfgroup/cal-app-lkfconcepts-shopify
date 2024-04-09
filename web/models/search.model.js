import mongoose from "mongoose";

const searchSchema = mongoose.Schema(
  {
    shop: {
      type: "String",
      required: true,
    },
    name: {
      type: 'String',
      required: true
    },
    filters: {
      type: "Object"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Search", searchSchema);
