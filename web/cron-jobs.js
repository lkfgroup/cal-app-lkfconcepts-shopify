import settingModel from "./models/setting.model.js"

const deleteBlockDates = async () => {
  try {
    let settings = await settingModel.find();

    for (let setting of settings) {
      let id = setting._id.toString();
      let config = setting?.settings;
      if (!config || config?.reverse_block_dates) {
        continue;
      }
      let today = new Date();
      let block_dates = config?.block_dates;
      if (block_dates?.length == 0) {
        continue;
      }
      let new_block_dates = block_dates.filter((block_date) => {
        let date = new Date(block_date.date);
        return today <= date;
      })
      if (new_block_dates?.length == block_dates?.length) {
        continue;
      }
      await settingModel.findOneAndUpdate({ _id: id }, {
        "settings.block_dates": new_block_dates
      })
    }

    await Promise.all(settings.map(async (setting) => {

    }));
  } catch (error) {
    console.log(error)
  }
}

export default deleteBlockDates