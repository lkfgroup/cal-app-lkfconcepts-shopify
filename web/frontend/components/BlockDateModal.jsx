import { FormLayout, LegacyCard, Modal, Text } from "@shopify/polaris";
import DateSelector from "./DateSelector";
import { timeOptions } from "../timeOptions";
import Select from 'react-select'
import { useState } from "react";
import moment from "moment";
import _ from "lodash";

export default function BlockDateModal({ open, setOpen, formik }) {
  const [dates, setDates] = useState([]);
  const [times, setTimes] = useState([]);

  const onSelectDates = (selectedDates) => {
    let dates = [];
    let currentDate = new Date(selectedDates.start);
    while (currentDate <= new Date(selectedDates.end)) {
      dates.push(moment(currentDate).format('YYYY-MM-DD'));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    setDates(dates);
  }

  const onAction = () => {
    let current = formik.values.delivery.block_dates;
    let update = dates.map((date) => {
      return {
        date,
        times
      }
    });
    update = _.unionBy(update, current, "date")
    update = update.sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    )
    formik.handleChange({
      target: {
        id: "delivery.block_dates",
        value: update,
      },
    });
    setOpen(false);
  }

  const onChange = (values) => {
    values = values.map((v) => v.value)
    setTimes(values);
  }

  return (
    <Modal
      fullScreen
      title="Block dates"
      open={open}
      onClose={() => setOpen(false)}
      primaryAction={{
        content: "Add",
        onAction: onAction
      }}
    >
      <LegacyCard>
        <LegacyCard.Section>
          <FormLayout>
            <DateSelector onSelectDates={onSelectDates} />
            <div>
              <Select
                options={timeOptions}
                isMulti
                menuPortalTarget={document.body}
                styles={{
                  menuPortal: base => ({ ...base, zIndex: 9999 })
                }}
                onChange={onChange}
              />
              <div class="Polaris-Labelled__HelpText" id="nameHelpText">
                <Text color="subdued">Leave empty to block entire day</Text>
              </div>
            </div>
          </FormLayout>
        </LegacyCard.Section>
      </LegacyCard>
    </Modal>
  )
}