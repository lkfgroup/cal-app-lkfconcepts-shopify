import { FormLayout, LegacyCard, Modal } from "@shopify/polaris";
import DateSelector from "./DateSelector";
import { timeOptions } from "../timeOptions";
import Select from 'react-select'
import { useState } from "react";
import moment from "moment";
import _ from "lodash";

export default function SpecificDateSlotModal({ open, setOpen, formik }) {
  const [dates, setDates] = useState([]);
  const [slots, setSlots] = useState([]);

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
    let current = formik.values.delivery.available_slot_specific_dates;
    let update = dates.map((date) => {
      return {
        date,
        slots
      }
    });
    update = _.unionBy(update, current, "date")
    update = update.sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    )
    formik.handleChange({
      target: {
        id: "delivery.available_slot_specific_dates",
        value: update,
      },
    });
    setOpen(false);
  }

  const onChange = (values) => {
    values = values.map((v) => v.value)
    setSlots(values);
  }

  return (
    <Modal
      fullScreen
      title="Available slots"
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
          <Select
            options={timeOptions}
            isMulti
            menuPortalTarget={document.body}
            styles={{
              menuPortal: base => ({ ...base, zIndex: 9999 })
            }}
            onChange={onChange}
          />
          </FormLayout>
        </LegacyCard.Section>
      </LegacyCard>
    </Modal>
  )
}